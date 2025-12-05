// routers/propiedades.js - Gestión de propiedades (VERSIÓN PUBLICACIÓN AUTOMÁTICA)
import express from "express";
import { dbQuery } from "../dbQuery.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { authenticate } from './authMiddleware.js';

const router = express.Router();

// =======================================
// GET PROPIEDADES (Listar con filtros)
// =======================================
router.get("/", async (req, res) => {
  try {
    const {
      tipoInmueble, operacion, precioMin, precioMax,
      habitaciones, banos, areaMin, areaMax, direccion,
      limit = 50, offset = 0, ordenar = "creado_en", orden = "DESC"
    } = req.query;

    // Solo mostramos las que están activas
    let query = `
      SELECT 
        p.*,
        u.nombre_completo as propietario_nombre,
        u.correo as propietario_correo,
        u.telefono as propietario_telefono
      FROM public.propiedades p
      INNER JOIN public.usuarios u ON p.propietario_id = u.id
      WHERE p.activa = TRUE 
    `;
    // NOTA: Si tu tabla tiene 'estado_publicacion', podrías agregar: AND p.estado_publicacion = 'PUBLICADO'
    
    const params = [];
    let paramCount = 1;

    // --- FILTROS ---
    if (tipoInmueble) { query += ` AND p.tipo_inmueble = $${paramCount++}`; params.push(tipoInmueble); }
    if (operacion) { query += ` AND p.operacion = $${paramCount++}`; params.push(operacion); }
    if (precioMin) { query += ` AND CAST(REPLACE(p.precio_canon, '$', '') AS NUMERIC) >= $${paramCount++}`; params.push(Number(precioMin)); }
    if (precioMax) { query += ` AND CAST(REPLACE(p.precio_canon, '$', '') AS NUMERIC) <= $${paramCount++}`; params.push(Number(precioMax)); }
    if (habitaciones) { query += ` AND p.habitaciones >= $${paramCount++}`; params.push(Number(habitaciones)); }
    if (banos) { query += ` AND p.banos >= $${paramCount++}`; params.push(Number(banos)); }
    if (areaMin) { query += ` AND p.area_m2 >= $${paramCount++}`; params.push(Number(areaMin)); }
    if (areaMax) { query += ` AND p.area_m2 <= $${paramCount++}`; params.push(Number(areaMax)); }
    if (direccion) { query += ` AND LOWER(p.direccion) LIKE LOWER($${paramCount++})`; params.push(`%${direccion}%`); }

    // --- ORDEN ---
    const ordenValido = ["creado_en", "precio_canon", "area_m2"].includes(ordenar) ? ordenar : "creado_en";
    const ordenValidoDir = orden.toUpperCase() === "ASC" ? "ASC" : "DESC";
    query += ` ORDER BY p.${ordenValido} ${ordenValidoDir}`;

    // --- PAGINACIÓN ---
    query += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(Number(limit), Number(offset));

    const result = await dbQuery(query, params);

    // --- CONTAR TOTAL ---
    // (Simplificado para rendimiento, cuenta todas las activas)
    const countResult = await dbQuery(`SELECT COUNT(*) as total FROM public.propiedades WHERE activa = TRUE`);
    const total = Number(countResult.rows[0].total);

    res.json({
      propiedades: result.rows,
      total,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (e) {
    console.error("❌ Error GET /propiedades:", e);
    res.status(500).json({ error: "Error consultando propiedades" });
  }
});

// =======================================
// GET MIS PROPIEDADES (Propietario)
// =======================================
router.get("/mis-propiedades", authenticate, async (req, res) => {
  try {
    const usuarioId = req.user.id; // Viene del token seguro
    const query = `SELECT * FROM public.propiedades WHERE propietario_id = $1 ORDER BY creado_en DESC`;
    const result = await dbQuery(query, [usuarioId]);
    res.json(result.rows);
  } catch (e) {
    console.error("❌ Error GET /mis-propiedades:", e);
    res.status(500).json({ error: "Error interno" });
  }
});

// =======================================
// GET PROPIEDAD POR ID
// =======================================
router.get("/:id", async (req, res) => {
  try {
    const query = `
      SELECT p.*, u.nombre_completo as propietario_nombre, u.correo as propietario_correo, u.telefono as propietario_telefono
      FROM public.propiedades p
      INNER JOIN public.usuarios u ON p.propietario_id = u.id
      WHERE p.id = $1 AND p.activa = TRUE
    `;
    const result = await dbQuery(query, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "No encontrada" });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Error al consultar detalle" });
  }
});

// =======================================
// CONFIGURACIÓN UPLOAD IMÁGENES
// =======================================
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (e) {}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${Math.floor(Math.random() * 1e9)}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    cb(null, safeName);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB límite

// =======================================
// POST CREAR PROPIEDAD (¡PUBLICACIÓN AUTOMÁTICA!)
// =======================================
router.post("/", authenticate, async (req, res) => {
  try {
    // Manejo de Multipart (Imágenes)
    const contentType = req.headers['content-type'] || '';
    if (contentType.startsWith('multipart/form-data')) {
      await new Promise((resolve, reject) => {
        upload.single('imagen')(req, res, (err) => err ? reject(err) : resolve());
      });
    }

    const { tipoInmueble, operacion, direccion, habitaciones, banos, areaM2, descripcion, precioCanon, imagenUrl } = req.body;
    const usuarioId = req.user.id; // Del token

    if (!direccion || !precioCanon) return res.status(400).json({ error: "Dirección y precio obligatorios" });

    // Procesar imagen
    let finalUrl = imagenUrl || null;
    let thumbUrl = null;
    if (req.file) {
      finalUrl = `/uploads/${req.file.filename}`;
      try {
        const thumbName = `thumb-${req.file.filename}`;
        await sharp(req.file.path).resize(400, 300, { fit: 'cover' }).toFile(path.join(uploadsDir, thumbName));
        thumbUrl = `/uploads/${thumbName}`;
      } catch (e) { console.warn("No se pudo crear thumbnail"); }
    }

    // 🔥 CAMBIO CLAVE: SIEMPRE 'PUBLICADO' Y SIEMPRE ACTIVA 🔥
    const estadoPublicacion = 'PUBLICADO';
    const activa = true;

    // Verificar si existe la columna 'estado_publicacion' en tu BD antes de insertar
    // Si tu tabla NO tiene esa columna, elimina la línea correspondiente en el INSERT.
    // Asumimos que sí existe por tu código anterior.
    const query = `
      INSERT INTO public.propiedades (
        propietario_id, tipo_inmueble, operacion, direccion, habitaciones, banos, area_m2, 
        descripcion, precio_canon, imagen_url, thumbnail_url, estado_publicacion, activa
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;

    const values = [
      usuarioId, tipoInmueble || 'APARTAMENTO', operacion || 'ARRIENDO', direccion,
      Number(habitaciones || 0), Number(banos || 0), Number(areaM2 || 0),
      descripcion, precioCanon, finalUrl, thumbUrl, estadoPublicacion, activa
    ];

    const result = await dbQuery(query, values);

    res.status(201).json({ message: "¡Propiedad publicada inmediatamente!", propiedad: result.rows[0] });

  } catch (e) {
    console.error("❌ Error creando propiedad:", e);
    res.status(500).json({ error: "Error interno al crear propiedad." });
  }
});

// =======================================
// DELETE ELIMINAR PROPIEDAD (Soft Delete)
// =======================================
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;

    // Verificar que sea el dueño
    const check = await dbQuery('SELECT propietario_id FROM public.propiedades WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: "No encontrada" });
    if (check.rows[0].propietario_id !== usuarioId) return res.status(403).json({ error: "No autorizado" });

    await dbQuery('UPDATE public.propiedades SET activa = FALSE WHERE id = $1', [id]);
    res.json({ message: "Propiedad eliminada" });
  } catch (e) {
    res.status(500).json({ error: "Error eliminando" });
  }
});

// =======================================
// POST PUBLICAR (Endpoint manual por si acaso)
// =======================================
router.post("/:id/publish", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;
    
    // Verificar dueño
    const check = await dbQuery('SELECT propietario_id FROM public.propiedades WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: "No encontrada" });
    if (check.rows[0].propietario_id !== usuarioId) return res.status(403).json({ error: "No autorizado" });

    await dbQuery("UPDATE public.propiedades SET estado_publicacion = 'PUBLICADO', activa = TRUE WHERE id = $1", [id]);
    res.json({ ok: true, message: "Publicada manualmente" });
  } catch (e) {
    res.status(500).json({ error: "Error al publicar" });
  }
});

export default router;