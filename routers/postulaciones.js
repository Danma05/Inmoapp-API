// routers/postulaciones.js - Gestión de postulaciones
import express from "express";
import { dbQuery } from "../dbQuery.js";

const router = express.Router();

// =======================================
// GET Postulaciones del usuario
// =======================================
router.get("/", async (req, res) => {
  try {
    const { usuarioId, estado } = req.query;

    if (!usuarioId) {
      return res.status(400).json({ error: "usuarioId es obligatorio" });
    }

    let query = `
      SELECT 
        po.*,
        p.*,
        u.nombre_completo as propietario_nombre,
        u.correo as propietario_correo
      FROM public.postulaciones po
      INNER JOIN public.propiedades p ON po.propiedad_id = p.id
      INNER JOIN public.usuarios u ON p.propietario_id = u.id
      WHERE po.usuario_id = $1
    `;

    const params = [usuarioId];

    if (estado) {
      query += ` AND po.estado = $2`;
      params.push(estado);
    }

    query += ` ORDER BY po.creado_en DESC`;

    const result = await dbQuery(query, params);
    res.json(result.rows);
  } catch (e) {
    console.error("❌ Error GET /postulaciones:", e);
    res.status(500).json({ error: "Error consultando postulaciones" });
  }
});

// =======================================
// POST Crear postulación
// =======================================
router.post("/", async (req, res) => {
  try {
    const { usuarioId, propiedadId, mensaje } = req.body;

    if (!usuarioId || !propiedadId) {
      return res.status(400).json({ error: "usuarioId y propiedadId son obligatorios" });
    }

    // Verificar si ya existe una postulación
    const existing = await dbQuery(
      "SELECT id FROM public.postulaciones WHERE usuario_id = $1 AND propiedad_id = $2",
      [usuarioId, propiedadId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Ya existe una postulación para esta propiedad" });
    }

    const query = `
      INSERT INTO public.postulaciones (usuario_id, propiedad_id, mensaje, estado)
      VALUES ($1, $2, $3, 'PENDIENTE')
      RETURNING *
    `;

    const result = await dbQuery(query, [usuarioId, propiedadId, mensaje || null]);
    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error("❌ Error POST /postulaciones:", e);
    res.status(500).json({ error: "Error creando postulación" });
  }
});

// =======================================
// PUT Actualizar estado de postulación
// =======================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, mensajeRespuesta } = req.body;

    if (!estado || !["PENDIENTE", "EN_REVISION", "APROBADA", "RECHAZADA"].includes(estado)) {
      return res.status(400).json({ error: "estado válido es obligatorio" });
    }

    const updateFields = [`estado = $1`, `actualizado_en = NOW()`];
    const params = [estado];

    if (mensajeRespuesta !== undefined) {
      updateFields.push(`mensaje_respuesta = $${params.length + 1}`);
      params.push(mensajeRespuesta);
    }

    params.push(id);

    const query = `
      UPDATE public.postulaciones
      SET ${updateFields.join(", ")}
      WHERE id = $${params.length}
      RETURNING *
    `;

    const result = await dbQuery(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Postulación no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (e) {
    console.error("❌ Error PUT /postulaciones/:id:", e);
    res.status(500).json({ error: "Error actualizando postulación" });
  }
});

export default router;

