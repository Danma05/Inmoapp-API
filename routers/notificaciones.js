// routers/notificaciones.js - Gestión de notificaciones
import express from "express";
import { dbQuery } from "../dbQuery.js";

const router = express.Router();

// =======================================
// GET Notificaciones del usuario
// =======================================
router.get("/", async (req, res) => {
  try {
    const { usuarioId, leida } = req.query;

    if (!usuarioId) {
      return res.status(400).json({ error: "usuarioId es obligatorio" });
    }

    let query = `
      SELECT * FROM public.notificaciones
      WHERE usuario_id = $1
    `;

    const params = [usuarioId];

    if (leida !== undefined) {
      query += ` AND leida = $2`;
      params.push(leida === "true");
    }

    query += ` ORDER BY creado_en DESC LIMIT 50`;

    const result = await dbQuery(query, params);
    res.json(result.rows);
  } catch (e) {
    console.error("❌ Error GET /notificaciones:", e);
    res.status(500).json({ error: "Error consultando notificaciones" });
  }
});

// =======================================
// PUT Marcar notificación como leída
// =======================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { usuarioId } = req.query;

    if (!usuarioId) {
      return res.status(400).json({ error: "usuarioId es obligatorio" });
    }

    const query = `
      UPDATE public.notificaciones
      SET leida = TRUE, actualizado_en = NOW()
      WHERE id = $1 AND usuario_id = $2
      RETURNING *
    `;

    const result = await dbQuery(query, [id, usuarioId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notificación no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (e) {
    console.error("❌ Error PUT /notificaciones/:id:", e);
    res.status(500).json({ error: "Error actualizando notificación" });
  }
});

// =======================================
// PUT Marcar todas como leídas
// =======================================
router.put("/marcar-todas", async (req, res) => {
  try {
    const { usuarioId } = req.body;

    if (!usuarioId) {
      return res.status(400).json({ error: "usuarioId es obligatorio" });
    }

    const query = `
      UPDATE public.notificaciones
      SET leida = TRUE, actualizado_en = NOW()
      WHERE usuario_id = $1 AND leida = FALSE
      RETURNING *
    `;

    const result = await dbQuery(query, [usuarioId]);
    res.json({ message: "Notificaciones marcadas como leídas", count: result.rows.length });
  } catch (e) {
    console.error("❌ Error PUT /notificaciones/marcar-todas:", e);
    res.status(500).json({ error: "Error actualizando notificaciones" });
  }
});

export default router;

