// routers/contratos.js
import express from "express";
import { dbQuery } from "../dbQuery.js";
import PDFDocument from "pdfkit"; // <--- IMPORTANTE: Nueva librería

const router = express.Router();

// =======================================
// GET Listar Contratos
// =======================================
router.get("/", async (req, res) => {
  try {
    const { usuarioId, propietarioId } = req.query;
    if (!usuarioId && !propietarioId) return res.status(400).json({ error: "Falta ID" });

    let query = `
      SELECT 
        c.id, c.fecha_inicio, c.fecha_fin, c.monto_mensual, c.estado,
        p.direccion, p.imagen_url,
        u_inq.nombre_completo as inquilino_nombre,
        u_prop.nombre_completo as propietario_nombre
      FROM public.contratos c
      INNER JOIN public.propiedades p ON c.propiedad_id = p.id
      INNER JOIN public.usuarios u_inq ON c.arrendatario_id = u_inq.id
      INNER JOIN public.usuarios u_prop ON c.propietario_id = u_prop.id
    `;

    const params = [];
    if (propietarioId) {
        query += ` WHERE c.propietario_id = $1`;
        params.push(propietarioId);
    } else {
        query += ` WHERE c.arrendatario_id = $1`;
        params.push(usuarioId);
    }
    query += ` ORDER BY c.creado_en DESC`;

    const result = await dbQuery(query, params);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: "Error al cargar contratos" });
  }
});

// =======================================
// GET DESCARGAR PDF (¡NUEVO!)
// =======================================
router.get("/:id/pdf", async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Buscar datos del contrato
        const query = `
            SELECT 
                c.*, 
                p.direccion, p.ciudad, p.tipo_inmueble,
                u_inq.nombre_completo as inq_nombre, u_inq.correo as inq_correo,
                u_prop.nombre_completo as prop_nombre, u_prop.correo as prop_correo
            FROM public.contratos c
            INNER JOIN public.propiedades p ON c.propiedad_id = p.id
            INNER JOIN public.usuarios u_inq ON c.arrendatario_id = u_inq.id
            INNER JOIN public.usuarios u_prop ON c.propietario_id = u_prop.id
            WHERE c.id = $1
        `;
        const result = await dbQuery(query, [id]);

        if (result.rows.length === 0) return res.status(404).send("Contrato no encontrado");
        const datos = result.rows[0];

        // 2. Crear documento PDF
        const doc = new PDFDocument({ margin: 50 });

        // Configurar headers para descarga
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Contrato_Arriendo_${id}.pdf`);

        doc.pipe(res); // Enviar PDF al cliente directamente

        // --- DISEÑO DEL PDF ---
        
        // Título
        doc.fontSize(20).text('CONTRATO DE ARRENDAMIENTO', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`ID Contrato: #${datos.id}`, { align: 'center' });
        doc.moveDown(2);

        // Cuerpo
        const texto = `
En la ciudad de Buga, a fecha de ${new Date().toLocaleDateString()}, comparecen por una parte:

EL ARRENDADOR: ${datos.prop_nombre}, con correo ${datos.prop_correo}.

Y por la otra parte:

EL ARRENDATARIO: ${datos.inq_nombre}, con correo ${datos.inq_correo}.

Quienes han convenido celebrar el presente contrato de arrendamiento sobre el inmueble ubicado en:
${datos.direccion} (${datos.tipo_inmueble}).

CLÁUSULAS:

PRIMERA - OBJETO: El arrendador entrega al arrendatario el uso y goce del inmueble mencionado.

SEGUNDA - CANON: El valor mensual del arrendamiento será de ${datos.monto_mensual}, pagaderos los primeros 5 días de cada mes.

TERCERA - VIGENCIA: El contrato tendrá una duración desde el ${new Date(datos.fecha_inicio).toLocaleDateString()} hasta el ${new Date(datos.fecha_fin).toLocaleDateString()}.

CUARTA - ESTADO: El inmueble se entrega en buen estado y el arrendatario se compromete a devolverlo en las mismas condiciones.
        `;

        doc.fontSize(12).text(texto, { align: 'justify', lineGap: 5 });
        
        doc.moveDown(4);

        // Firmas
        doc.text('__________________________                __________________________');
        doc.text(`Firma Arrendador: ${datos.prop_nombre}                Firma Arrendatario: ${datos.inq_nombre}`);

        doc.end(); // Finalizar PDF

    } catch (e) {
        console.error("Error PDF:", e);
        res.status(500).send("Error generando PDF");
    }
});

// =======================================
// POST Crear Nuevo Contrato
// =======================================
router.post("/", async (req, res) => {
  try {
    const { propiedadId, arrendatarioId, propietarioId, fechaInicio, fechaFin, monto } = req.body;
    
    // Validar datos...
    if (!propiedadId || !arrendatarioId || !monto) return res.status(400).json({ error: "Datos incompletos" });

    const query = `
      INSERT INTO public.contratos 
      (propiedad_id, arrendatario_id, propietario_id, fecha_inicio, fecha_fin, monto_mensual, estado)
      VALUES ($1, $2, $3, $4, $5, $6, 'VIGENTE')
      RETURNING *
    `;
    const result = await dbQuery(query, [propiedadId, arrendatarioId, propietarioId, fechaInicio, fechaFin, monto]);
    res.status(201).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Error al crear" });
  }
});

export default router;