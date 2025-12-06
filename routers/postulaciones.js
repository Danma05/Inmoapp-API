// routers/postulaciones.js
import express from "express";
import { dbQuery } from "../dbQuery.js";

const router = express.Router();

// =======================================
// GET Postulaciones (Soporta filtro por Usuario o Propietario)
// =======================================
router.get("/", async (req, res) => {
  try {
    const { usuarioId, propietarioId } = req.query;

    if (!usuarioId && !propietarioId) {
      return res.status(400).json({ error: "Falta ID de usuario o propietario" });
    }

    let query = `
      SELECT 
        po.id as postulacion_id,
        po.usuario_id,          
        p.propietario_id,
        po.mensaje,
        po.mensaje_respuesta,
        po.estado,
        po.creado_en,
        p.id as propiedad_id,
        p.direccion,
        p.precio_canon,
        p.imagen_url,
        
        -- Datos del Propietario (para cuando consulta el inquilino)
        u_prop.nombre_completo as propietario_nombre,
        u_prop.correo as propietario_correo,
        u_prop.telefono as propietario_telefono,

        -- Datos del Candidato/Inquilino (para cuando consulta el dueño)
        u_inq.nombre_completo as inquilino_nombre,
        u_inq.correo as inquilino_correo,
        u_inq.telefono as inquilino_telefono

      FROM public.postulaciones po
      INNER JOIN public.propiedades p ON po.propiedad_id = p.id
      INNER JOIN public.usuarios u_prop ON p.propietario_id = u_prop.id
      INNER JOIN public.usuarios u_inq ON po.usuario_id = u_inq.id
    `;

    const params = [];

    if (propietarioId) {
        // Si consulta el DUEÑO -> Ver quién se postuló a sus propiedades
        query += ` WHERE p.propietario_id = $1`;
        params.push(propietarioId);
    } else {
        // Si consulta el INQUILINO -> Ver sus propias postulaciones
        query += ` WHERE po.usuario_id = $1`;
        params.push(usuarioId);
    }

    query += ` ORDER BY po.creado_en DESC`;

    const result = await dbQuery(query, params);
    res.json(result.rows);
  } catch (e) {
    console.error("❌ Error GET /postulaciones:", e.message);
    res.status(500).json({ error: "Error interno: " + e.message });
  }
});

// =======================================
// POST Crear postulación
// =======================================
router.post("/", async (req, res) => {
  try {
    const { usuarioId, propiedadId, mensaje } = req.body;

    if (!usuarioId || !propiedadId) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // Verificar duplicados
    const existing = await dbQuery(
      "SELECT id FROM public.postulaciones WHERE usuario_id = $1 AND propiedad_id = $2",
      [usuarioId, propiedadId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Ya te has postulado a esta propiedad." });
    }

    const query = `
      INSERT INTO public.postulaciones (usuario_id, propiedad_id, mensaje, estado)
      VALUES ($1, $2, $3, 'PENDIENTE')
      RETURNING *
    `;

    const result = await dbQuery(query, [usuarioId, propiedadId, mensaje || null]);
    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error("❌ Error POST /postulaciones:", e.message);
    res.status(500).json({ error: "Error al postular: " + e.message });
  }
});

// =======================================
// PUT Actualizar estado (Aprobar/Rechazar)
// =======================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body; // APROBADA, RECHAZADA

    if (!estado) return res.status(400).json({ error: "Estado obligatorio" });

    const query = `
      UPDATE public.postulaciones
      SET estado = $1, actualizado_en = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await dbQuery(query, [estado, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Postulación no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (e) {
    console.error("❌ Error PUT /postulaciones/:id:", e);
    res.status(500).json({ error: "Error al actualizar" });
  }
});

export default router;