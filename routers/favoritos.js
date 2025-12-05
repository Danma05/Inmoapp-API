// routers/favoritos.js - Gestión de favoritos
import express from "express";
import { dbQuery } from "../dbQuery.js";

const router = express.Router();

// =======================================
// GET Favoritos del usuario
// =======================================
router.get("/", async (req, res) => {
  try {
    const { usuarioId } = req.query;

    if (!usuarioId) return res.status(400).json({ error: "Falta usuarioId" });

    // Consulta segura: Quitamos 'p.activa' para evitar errores si no existe la columna
    const query = `
      SELECT 
        f.id AS favorito_id,
        f.creado_en,
        p.id AS propiedad_id,
        p.direccion,
        p.precio_canon,
        p.imagen_url,
        p.thumbnail_url,
        p.habitaciones,
        p.banos,
        p.area_m2,
        p.operacion,
        u.nombre_completo as propietario_nombre
      FROM public.favoritos f
      INNER JOIN public.propiedades p ON f.propiedad_id = p.id
      INNER JOIN public.usuarios u ON p.propietario_id = u.id
      WHERE f.usuario_id = $1
      ORDER BY f.creado_en DESC
    `;

    const result = await dbQuery(query, [usuarioId]);
    res.json({ ok: true, favoritos: result.rows });

  } catch (e) {
    console.error("❌ Error GET /favoritos:", e.message);
    res.status(500).json({ error: "Error al cargar favoritos" });
  }
});

// =======================================
// POST Agregar a favoritos
// =======================================
router.post("/", async (req, res) => {
  try {
    const { usuarioId, propiedadId } = req.body;

    if (!usuarioId || !propiedadId) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    // Verificar si ya existe
    const existing = await dbQuery(
      "SELECT id FROM public.favoritos WHERE usuario_id = $1 AND propiedad_id = $2",
      [usuarioId, propiedadId]
    );

    if (existing.rows.length > 0) {
      return res.status(200).json({ ok: true, message: 'Ya estaba en favoritos' });
    }

    const query = `
      INSERT INTO public.favoritos (usuario_id, propiedad_id)
      VALUES ($1, $2)
      RETURNING *
    `;

    const result = await dbQuery(query, [usuarioId, propiedadId]);
    res.status(201).json({ ok: true, favorito: result.rows[0] });

  } catch (e) {
    console.error("❌ Error POST /favoritos:", e.message);
    res.status(500).json({ error: "Error al guardar favorito" });
  }
});

// =======================================
// DELETE Quitar de favoritos (Por Propiedad ID y Usuario)
// =======================================
router.delete("/:propiedadId", async (req, res) => {
  try {
    const { propiedadId } = req.params;
    const { usuarioId } = req.query; // Lo recibimos por query para simplificar

    if (!usuarioId) return res.status(400).json({ error: "Falta usuarioId" });

    const query = `
      DELETE FROM public.favoritos
      WHERE propiedad_id = $1 AND usuario_id = $2
      RETURNING *
    `;

    const result = await dbQuery(query, [propiedadId, usuarioId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No encontrado" });
    }

    res.json({ ok: true, message: "Eliminado" });

  } catch (e) {
    console.error("❌ Error DELETE /favoritos:", e.message);
    res.status(500).json({ error: "Error al eliminar" });
  }
});

export default router;