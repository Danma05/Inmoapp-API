// routers/favoritos.js - Gestión de favoritos
import express from "express";
import { dbQuery } from "../dbQuery.js";

const router = express.Router();

// =======================================
// GET Favoritos del usuario
// =======================================
router.get("/", async (req, res) => {
  try {
    // aceptar usuarioId desde query o header
    const usuarioId = req.query?.usuarioId || req.headers["x-usuario-id"] || req.headers["x-usuarioid"];

    if (!usuarioId) {
      return res.status(400).json({ error: "usuarioId es obligatorio (query o header)" });
    }

    const query = `
      SELECT 
        f.id AS favorito_id,
        f.creado_en AS favorito_creado_en,
        p.id AS propiedad_id,
        p.direccion,
        p.precio_canon,
        p.imagen_url,
        p.habitaciones,
        p.banos,
        p.area_m2,
        p.activa,
        u.nombre_completo as propietario_nombre
      FROM public.favoritos f
      INNER JOIN public.propiedades p ON f.propiedad_id = p.id
      INNER JOIN public.usuarios u ON p.propietario_id = u.id
      WHERE f.usuario_id = $1 AND p.activa = TRUE
      ORDER BY f.creado_en DESC
    `;

  const result = await dbQuery(query, [Number(usuarioId)]);

    // Mapear resultado para devolver estructura clara: { favoritoId, propiedad: { ... } }
    const mapped = result.rows.map(r => ({
      favorito_id: r.favorito_id,
      favoritoId: r.favorito_id,
      creado_en: r.favorito_creado_en,
      propiedad: {
        id: r.propiedad_id,
        direccion: r.direccion,
        precio_canon: r.precio_canon,
        imagen_url: r.imagen_url,
        habitaciones: r.habitaciones,
        banos: r.banos,
        area_m2: r.area_m2,
        activo: r.activa
      },
      propietario_nombre: r.propietario_nombre
    }));

    res.json({ ok: true, favoritos: mapped });
  } catch (e) {
    console.error("❌ Error GET /favoritos:", e);
    res.status(500).json({ error: "Error consultando favoritos" });
  }
});

// =======================================
// POST Agregar a favoritos
// =======================================
router.post("/", async (req, res) => {
  try {
    // aceptar usuarioId desde body o header
    const bodyUsuarioId = req.body?.usuarioId;
    const usuarioId = bodyUsuarioId || req.headers["x-usuario-id"] || req.headers["x-usuarioid"];
    const { propiedadId } = req.body;

    if (!usuarioId || !propiedadId) {
      return res.status(400).json({ error: "usuarioId y propiedadId son obligatorios (body o header)" });
    }

    // Verificar si ya existe (idempotente)
    const existing = await dbQuery(
      "SELECT * FROM public.favoritos WHERE usuario_id = $1 AND propiedad_id = $2",
      [Number(usuarioId), Number(propiedadId)]
    );

    if (existing.rows.length > 0) {
      // devolver la fila existente en forma estandarizada
      return res.status(200).json({ ok: true, favorito: existing.rows[0], message: 'Ya estaba en favoritos' });
    }

    const query = `
      INSERT INTO public.favoritos (usuario_id, propiedad_id)
      VALUES ($1, $2)
      RETURNING *
    `;

    const result = await dbQuery(query, [Number(usuarioId), Number(propiedadId)]);
    res.status(201).json({ ok: true, favorito: result.rows[0] });
  } catch (e) {
    console.error("❌ Error POST /favoritos:", e);
    res.status(500).json({ error: "Error agregando a favoritos" });
  }
});

// =======================================
// DELETE Quitar de favoritos
// =======================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // aceptar usuarioId desde query, body o cabecera para mayor compatibilidad
    const usuarioId =
      req.query && req.query.usuarioId
        ? req.query.usuarioId
        : req.body && req.body.usuarioId
        ? req.body.usuarioId
        : req.headers["x-usuario-id"] || req.headers["x-usuarioid"];

    if (!usuarioId) {
      return res.status(400).json({ error: "Se requiere usuarioId (query, body o header)" });
    }

    const query = `
      DELETE FROM public.favoritos
      WHERE id = $1 AND usuario_id = $2
      RETURNING *
    `;

    const result = await dbQuery(query, [id, usuarioId]);

    if (result.rows.length === 0) {
      // Puede que no exista el id o no pertenezca al usuario
      return res.status(404).json({ error: "Favorito no encontrado o no pertenece al usuario" });
    }

    res.json({ ok: true, message: "Favorito eliminado correctamente", eliminado: result.rows[0] });
  } catch (e) {
    console.error("❌ Error DELETE /favoritos/:id:", e);
    res.status(500).json({ error: "Error eliminando favorito" });
  }
});

export default router;

