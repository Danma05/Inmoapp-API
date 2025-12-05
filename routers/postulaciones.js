// routers/postulaciones.js
import express from "express";
import { dbQuery } from "../dbQuery.js";

const router = express.Router();

// =======================================
// GET Postulaciones del usuario
// =======================================
router.get("/", async (req, res) => {
  try {
    const { usuarioId } = req.query;

    if (!usuarioId) return res.status(400).json({ error: "Falta usuarioId" });

    // Consulta segura: Solo pedimos columnas que sabemos que existen
    const query = `
      SELECT 
        po.id as postulacion_id,
        po.mensaje,
        po.mensaje_respuesta,
        po.estado,
        po.creado_en,
        p.id as propiedad_id,
        p.direccion,
        p.precio_canon,
        p.imagen_url,
        p.operacion,
        u.nombre_completo as propietario_nombre,
        u.correo as propietario_correo,
        u.telefono as propietario_telefono
      FROM public.postulaciones po
      INNER JOIN public.propiedades p ON po.propiedad_id = p.id
      INNER JOIN public.usuarios u ON p.propietario_id = u.id
      WHERE po.usuario_id = $1
      ORDER BY po.creado_en DESC
    `;

    const result = await dbQuery(query, [usuarioId]);
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

export default router;