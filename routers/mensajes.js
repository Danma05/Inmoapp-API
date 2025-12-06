// routers/mensajes.js
import express from "express";
import { dbQuery } from "../dbQuery.js";

const router = express.Router();

// =======================================
// GET Conversaciones (Agrupadas por Usuario y Propiedad)
// =======================================
router.get("/conversaciones", async (req, res) => {
  try {
    const { usuarioId } = req.query;

    if (!usuarioId) return res.status(400).json({ error: "Falta usuarioId" });

    // Busca conversaciones donde el usuario es remitente o destinatario
    // Agrupa por el "otro usuario" y la "propiedad"
    const query = `
      SELECT DISTINCT ON (otro_usuario_id, p.id)
        CASE 
          WHEN m.remitente_id = $1 THEN m.destinatario_id 
          ELSE m.remitente_id 
        END as otro_usuario_id,
        
        u.nombre_completo as otro_usuario_nombre,
        u.rol as otro_usuario_rol,
        
        p.id as propiedad_id,
        p.direccion as propiedad_titulo,
        p.thumbnail_url as propiedad_img,
        
        m.mensaje as ultimo_mensaje,
        m.creado_en as fecha_ultimo,
        
        (SELECT COUNT(*) FROM public.mensajes m2 
         WHERE m2.destinatario_id = $1 
         AND m2.leido = FALSE 
         AND (m2.remitente_id = CASE WHEN m.remitente_id = $1 THEN m.destinatario_id ELSE m.remitente_id END)
         AND m2.propiedad_id = p.id
        ) as no_leidos

      FROM public.mensajes m
      INNER JOIN public.usuarios u ON (
        CASE WHEN m.remitente_id = $1 THEN m.destinatario_id ELSE m.remitente_id END = u.id
      )
      LEFT JOIN public.propiedades p ON m.propiedad_id = p.id
      WHERE m.remitente_id = $1 OR m.destinatario_id = $1
      ORDER BY otro_usuario_id, p.id, m.creado_en DESC
    `;

    const result = await dbQuery(query, [usuarioId]);
    
    // Reordenar por fecha más reciente (ya que DISTINCT ON obliga a ordenar por ID primero)
    const conversaciones = result.rows.sort((a, b) => new Date(b.fecha_ultimo) - new Date(a.fecha_ultimo));

    res.json(conversaciones);
  } catch (e) {
    console.error("❌ Error GET /conversaciones:", e);
    res.status(500).json({ error: "Error al cargar conversaciones" });
  }
});

// =======================================
// GET Mensajes de un chat específico
// =======================================
router.get("/", async (req, res) => {
  try {
    const { usuarioId, otroUsuarioId, propiedadId } = req.query;

    if (!usuarioId || !otroUsuarioId) return res.status(400).json({ error: "Faltan IDs" });

    // Consulta básica de chat
    let query = `
      SELECT 
        m.*,
        CASE WHEN m.remitente_id = $1 THEN 'sent' ELSE 'received' END as tipo
      FROM public.mensajes m
      WHERE (
        (m.remitente_id = $1 AND m.destinatario_id = $2) OR
        (m.remitente_id = $2 AND m.destinatario_id = $1)
      )
    `;
    
    const params = [usuarioId, otroUsuarioId];

    // Si es un chat vinculado a una propiedad específica
    if (propiedadId) {
      query += ` AND m.propiedad_id = $3`;
      params.push(propiedadId);
    }

    query += ` ORDER BY m.creado_en ASC`;

    const result = await dbQuery(query, params);

    // Marcar como leídos al abrir
    await dbQuery(
      `UPDATE public.mensajes SET leido = TRUE 
       WHERE destinatario_id = $1 AND remitente_id = $2 AND propiedad_id = $3`,
      [usuarioId, otroUsuarioId, propiedadId || null]
    );

    res.json(result.rows);
  } catch (e) {
    console.error("❌ Error GET /mensajes:", e);
    res.status(500).json({ error: "Error al cargar mensajes" });
  }
});

// =======================================
// POST Enviar Mensaje
// =======================================
router.post("/", async (req, res) => {
  try {
    const { remitenteId, destinatarioId, propiedadId, mensaje } = req.body;

    if (!remitenteId || !destinatarioId || !mensaje) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const query = `
      INSERT INTO public.mensajes (remitente_id, destinatario_id, propiedad_id, mensaje)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await dbQuery(query, [remitenteId, destinatarioId, propiedadId || null, mensaje]);
    res.json(result.rows[0]);
  } catch (e) {
    console.error("❌ Error POST /mensajes:", e);
    res.status(500).json({ error: "Error al enviar" });
  }
});

export default router;