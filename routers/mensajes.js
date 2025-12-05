// routers/mensajes.js - Gestión de mensajes
import express from "express";
import { dbQuery } from "../dbQuery.js";

const router = express.Router();

// =======================================
// GET Conversaciones del usuario
// =======================================
router.get("/conversaciones", async (req, res) => {
  try {
    const { usuarioId } = req.query;

    if (!usuarioId) {
      return res.status(400).json({ error: "usuarioId es obligatorio" });
    }

    const query = `
      SELECT DISTINCT ON (CASE WHEN m.remitente_id = $1 THEN m.destinatario_id ELSE m.remitente_id END)
        CASE WHEN m.remitente_id = $1 THEN m.destinatario_id ELSE m.remitente_id END as otro_usuario_id,
        u.nombre_completo as otro_usuario_nombre,
        u.correo as otro_usuario_correo,
        p.id as propiedad_id,
        p.direccion as propiedad_direccion,
        m.mensaje as ultimo_mensaje,
        m.creado_en as ultima_fecha,
        COUNT(*) FILTER (WHERE m.leido = FALSE AND m.destinatario_id = $1) as no_leidos
      FROM public.mensajes m
      INNER JOIN public.usuarios u ON (
        CASE WHEN m.remitente_id = $1 THEN m.destinatario_id ELSE m.remitente_id END = u.id
      )
      LEFT JOIN public.propiedades p ON m.propiedad_id = p.id
      WHERE m.remitente_id = $1 OR m.destinatario_id = $1
      GROUP BY otro_usuario_id, u.nombre_completo, u.correo, p.id, p.direccion, m.mensaje, m.creado_en
      ORDER BY otro_usuario_id, m.creado_en DESC
    `;

    const result = await dbQuery(query, [usuarioId]);
    res.json(result.rows);
  } catch (e) {
    console.error("❌ Error GET /mensajes/conversaciones:", e);
    res.status(500).json({ error: "Error consultando conversaciones" });
  }
});

// =======================================
// GET Mensajes de una conversación
// =======================================
router.get("/", async (req, res) => {
  try {
    const { usuarioId, otroUsuarioId, propiedadId } = req.query;

    if (!usuarioId || !otroUsuarioId) {
      return res.status(400).json({ error: "usuarioId y otroUsuarioId son obligatorios" });
    }

    let query = `
      SELECT 
        m.*,
        u_rem.nombre_completo as remitente_nombre,
        u_dest.nombre_completo as destinatario_nombre
      FROM public.mensajes m
      INNER JOIN public.usuarios u_rem ON m.remitente_id = u_rem.id
      INNER JOIN public.usuarios u_dest ON m.destinatario_id = u_dest.id
      WHERE (
        (m.remitente_id = $1 AND m.destinatario_id = $2) OR
        (m.remitente_id = $2 AND m.destinatario_id = $1)
      )
    `;

    const params = [usuarioId, otroUsuarioId];

    if (propiedadId) {
      query += ` AND m.propiedad_id = $3`;
      params.push(propiedadId);
    }

    query += ` ORDER BY m.creado_en ASC`;

    const result = await dbQuery(query, params);

    // Marcar como leídos
    await dbQuery(
      `UPDATE public.mensajes 
       SET leido = TRUE 
       WHERE destinatario_id = $1 AND remitente_id = $2 AND leido = FALSE`,
      [usuarioId, otroUsuarioId]
    );

    res.json(result.rows);
  } catch (e) {
    console.error("❌ Error GET /mensajes:", e);
    res.status(500).json({ error: "Error consultando mensajes" });
  }
});

// =======================================
// POST Enviar mensaje
// =======================================
router.post("/", async (req, res) => {
  try {
    const { remitenteId, destinatarioId, propiedadId, mensaje } = req.body;

    if (!remitenteId || !destinatarioId || !mensaje) {
      return res.status(400).json({ error: "remitenteId, destinatarioId y mensaje son obligatorios" });
    }

    const query = `
      INSERT INTO public.mensajes (remitente_id, destinatario_id, propiedad_id, mensaje, leido)
      VALUES ($1, $2, $3, $4, FALSE)
      RETURNING *
    `;

    const result = await dbQuery(query, [
      remitenteId,
      destinatarioId,
      propiedadId || null,
      mensaje
    ]);

    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error("❌ Error POST /mensajes:", e);
    res.status(500).json({ error: "Error enviando mensaje" });
  }
});

export default router;

