// routers/visitas.js - Gestión de visitas
import express from "express";
import { dbQuery } from "../dbQuery.js";

const router = express.Router();

// =======================================
// GET Visitas del usuario
// =======================================
router.get("/", async (req, res) => {
  try {
    const { usuarioId, estado } = req.query;

    if (!usuarioId) {
      return res.status(400).json({ error: "usuarioId es obligatorio" });
    }

    let query = `
      SELECT 
        v.*,
        p.*,
        u.nombre_completo as propietario_nombre,
        u.correo as propietario_correo,
        u.telefono as propietario_telefono
      FROM public.visitas v
      INNER JOIN public.propiedades p ON v.propiedad_id = p.id
      INNER JOIN public.usuarios u ON p.propietario_id = u.id
      WHERE v.usuario_id = $1
    `;

    const params = [usuarioId];

    if (estado) {
      query += ` AND v.estado = $2`;
      params.push(estado);
    }

    query += ` ORDER BY v.fecha_visita DESC`;

    const result = await dbQuery(query, params);
    res.json(result.rows);
  } catch (e) {
    console.error("❌ Error GET /visitas:", e);
    res.status(500).json({ error: "Error consultando visitas" });
  }
});

// =======================================
// POST Crear visita
// =======================================
router.post("/", async (req, res) => {
  try {
    const { usuarioId, propiedadId, fechaVisita, horaVisita, notas } = req.body;

    if (!usuarioId || !propiedadId || !fechaVisita || !horaVisita) {
      return res.status(400).json({ error: "usuarioId, propiedadId, fechaVisita y horaVisita son obligatorios" });
    }

    const query = `
      INSERT INTO public.visitas (usuario_id, propiedad_id, fecha_visita, hora_visita, notas, estado)
      VALUES ($1, $2, $3, $4, $5, 'PENDIENTE')
      RETURNING *
    `;

    const result = await dbQuery(query, [
      usuarioId,
      propiedadId,
      fechaVisita,
      horaVisita,
      notas || null
    ]);

    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error("❌ Error POST /visitas:", e);
    res.status(500).json({ error: "Error creando visita" });
  }
});

// =======================================
// PUT Actualizar visita (confirmar/cancelar)
// =======================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, notas } = req.body;

    if (!estado || !["PENDIENTE", "CONFIRMADA", "CANCELADA", "COMPLETADA"].includes(estado)) {
      return res.status(400).json({ error: "estado válido es obligatorio" });
    }

    const updateFields = [`estado = $1`, `actualizado_en = NOW()`];
    const params = [estado];

    if (notas !== undefined) {
      updateFields.push(`notas = $${params.length + 1}`);
      params.push(notas);
    }

    params.push(id);

    const query = `
      UPDATE public.visitas
      SET ${updateFields.join(", ")}
      WHERE id = $${params.length}
      RETURNING *
    `;

    const result = await dbQuery(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Visita no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (e) {
    console.error("❌ Error PUT /visitas/:id:", e);
    res.status(500).json({ error: "Error actualizando visita" });
  }
});

export default router;

