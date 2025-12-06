// routers/contratos.js
import express from "express";
import { dbQuery } from "../dbQuery.js";

const router = express.Router();

// =======================================
// GET Listar Contratos (Dueño o Inquilino)
// =======================================
router.get("/", async (req, res) => {
  try {
    const { usuarioId, propietarioId } = req.query;

    if (!usuarioId && !propietarioId) {
      return res.status(400).json({ error: "Falta ID" });
    }

    let query = `
      SELECT 
        c.id, c.fecha_inicio, c.fecha_fin, c.monto_mensual, c.estado, c.documento_url,
        p.direccion, p.imagen_url,
        u_inq.nombre_completo as inquilino_nombre,
        u_inq.correo as inquilino_correo,
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
    console.error("❌ Error GET /contratos:", e);
    res.status(500).json({ error: "Error al cargar contratos" });
  }
});

// =======================================
// POST Crear Nuevo Contrato
// =======================================
router.post("/", async (req, res) => {
  try {
    const { propiedadId, arrendatarioId, propietarioId, fechaInicio, fechaFin, monto } = req.body;

    if (!propiedadId || !arrendatarioId || !propietarioId || !fechaInicio || !fechaFin || !monto) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const query = `
      INSERT INTO public.contratos 
      (propiedad_id, arrendatario_id, propietario_id, fecha_inicio, fecha_fin, monto_mensual, estado)
      VALUES ($1, $2, $3, $4, $5, $6, 'VIGENTE')
      RETURNING *
    `;

    const result = await dbQuery(query, [propiedadId, arrendatarioId, propietarioId, fechaInicio, fechaFin, monto]);
    
    // Opcional: Cambiar estado de la propiedad a "ARRENDADA" para que no salga más en búsquedas
    // await dbQuery("UPDATE public.propiedades SET estado_publicacion = 'ARRENDADO' WHERE id = $1", [propiedadId]);

    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error("❌ Error POST /contratos:", e);
    res.status(500).json({ error: "Error al crear contrato" });
  }
});

export default router;