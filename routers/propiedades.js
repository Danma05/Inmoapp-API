// routers/propiedades.js - Gestión de propiedades
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
      tipoInmueble,
      operacion,
      precioMin,
      precioMax,
      habitaciones,
      banos,
      areaMin,
      areaMax,
      direccion,
      limit = 50,
      offset = 0,
      ordenar = "creado_en",
      orden = "DESC"
    } = req.query;

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
    const params = [];
    let paramCount = 1;

    if (tipoInmueble) {
      query += ` AND p.tipo_inmueble = $${paramCount}`;
      params.push(tipoInmueble);
      paramCount++;
    }

    if (operacion) {
      query += ` AND p.operacion = $${paramCount}`;
      params.push(operacion);
      paramCount++;
    }

    if (precioMin) {
      query += ` AND CAST(REPLACE(p.precio_canon, '$', '') AS NUMERIC) >= $${paramCount}`;
      params.push(Number(precioMin));
      paramCount++;
    }

    if (precioMax) {
      query += ` AND CAST(REPLACE(p.precio_canon, '$', '') AS NUMERIC) <= $${paramCount}`;
      params.push(Number(precioMax));
      paramCount++;
    }

    if (habitaciones) {
      query += ` AND p.habitaciones >= $${paramCount}`;
      params.push(Number(habitaciones));
      paramCount++;
    }

    if (banos) {
      query += ` AND p.banos >= $${paramCount}`;
      params.push(Number(banos));
      paramCount++;
    }

    if (areaMin) {
      query += ` AND p.area_m2 >= $${paramCount}`;
      params.push(Number(areaMin));
      paramCount++;
    }

    if (areaMax) {
      query += ` AND p.area_m2 <= $${paramCount}`;
      params.push(Number(areaMax));
      paramCount++;
    }

    if (direccion) {
      query += ` AND LOWER(p.direccion) LIKE LOWER($${paramCount})`;
      params.push(`%${direccion}%`);
      paramCount++;
    }

    const ordenValido = ["creado_en", "precio_canon", "area_m2"].includes(ordenar) ? ordenar : "creado_en";
    const ordenValidoDir = orden.toUpperCase() === "ASC" ? "ASC" : "DESC";
    query += ` ORDER BY p.${ordenValido} ${ordenValidoDir}`;

    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(Number(limit), Number(offset));

    const result = await dbQuery(query, params);

    // Contar total (aplicar todos los mismos filtros)
    let countQuery = `SELECT COUNT(*) as total FROM public.propiedades p WHERE p.activa = TRUE`;
    const countParams = [];
    let countParamCount = 1;

    if (tipoInmueble) {
      countQuery += ` AND p.tipo_inmueble = $${countParamCount}`;
      countParams.push(tipoInmueble);
      countParamCount++;
    }
    if (operacion) {
      countQuery += ` AND p.operacion = $${countParamCount}`;
      countParams.push(operacion);
      countParamCount++;
    }
    if (precioMin) {
      countQuery += ` AND CAST(REPLACE(p.precio_canon, '$', '') AS NUMERIC) >= $${countParamCount}`;
      countParams.push(Number(precioMin));
      countParamCount++;
    }
    if (precioMax) {
      countQuery += ` AND CAST(REPLACE(p.precio_canon, '$', '') AS NUMERIC) <= $${countParamCount}`;
      countParams.push(Number(precioMax));
      countParamCount++;
    }
    if (habitaciones) {
      countQuery += ` AND p.habitaciones >= $${countParamCount}`;
      countParams.push(Number(habitaciones));
      countParamCount++;
    }
    if (banos) {
      countQuery += ` AND p.banos >= $${countParamCount}`;
      countParams.push(Number(banos));
      countParamCount++;
    }
    if (areaMin) {
      countQuery += ` AND p.area_m2 >= $${countParamCount}`;
      countParams.push(Number(areaMin));
      countParamCount++;
    }
    if (areaMax) {
      countQuery += ` AND p.area_m2 <= $${countParamCount}`;
      countParams.push(Number(areaMax));
      countParamCount++;
    }
    if (direccion) {
      countQuery += ` AND LOWER(p.direccion) LIKE LOWER($${countParamCount})`;
      countParams.push(`%${direccion}%`);
      countParamCount++;
    }

    const countResult = await dbQuery(countQuery, countParams);
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
// GET MIS PROPIEDADES (Para propietario)
// IMPORTANTE: Debe ir ANTES de /:id para evitar conflictos
// =======================================
router.get("/mis-propiedades", authenticate, async (req, res) => {
  try {
    const usuarioId = req.user && req.user.id;

    if (!usuarioId) {
      return res.status(401).json({ error: "Autenticación requerida" });
    }

    const query = `
      SELECT * FROM public.propiedades
      WHERE propietario_id = $1
      ORDER BY creado_en DESC
    `;

    const result = await dbQuery(query, [usuarioId]);
    res.json(result.rows);
  } catch (e) {
    console.error("❌ Error GET /propiedades/mis-propiedades:", e);
    res.status(500).json({ error: "Error consultando propiedades" });
  }
});

// =======================================
// GET PROPIEDAD POR ID
// =======================================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        p.*,
        u.nombre_completo as propietario_nombre,
        u.correo as propietario_correo,
        u.telefono as propietario_telefono
      FROM public.propiedades p
      INNER JOIN public.usuarios u ON p.propietario_id = u.id
      WHERE p.id = $1 AND p.activa = TRUE
    `;

    const result = await dbQuery(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Propiedad no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (e) {
    console.error("❌ Error GET /propiedades/:id:", e);
    res.status(500).json({ error: "Error consultando propiedad" });
  }
});

// =======================================
// CONFIGURACIÓN UPLOAD (multer)
// =======================================
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (e) { /* ignore */ }

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const rnd = Math.floor(Math.random() * 1e9);
    const safeOrig = file.originalname.replace(/[^a-zA-Z0-9.\-_\.]/g, '_');
    const safeName = `${Date.now()}-${rnd}-${safeOrig}`;
    cb(null, safeName);
  }
});

// Valid mime types and limits
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: function (req, file, cb) {
    if (ALLOWED_MIMES.includes(file.mimetype)) return cb(null, true);
    const err = new Error('Tipo de archivo no permitido. Solo se aceptan: jpeg, png, webp.');
    err.code = 'LIMIT_FILE_TYPE';
    return cb(err);
  }
});

// =======================================
// POST CREAR PROPIEDAD (soporta multipart/form-data con campo 'imagen')
// =======================================
router.post("/", authenticate, async (req, res) => {
  try {
    // Si el request es multipart/form-data, invocar multer dinámicamente.
    const contentType = req.headers['content-type'] || '';
    if (contentType.startsWith('multipart/form-data')) {
      await new Promise((resolve, reject) => {
        upload.single('imagen')(req, res, (err) => {
          if (err) return reject(err);
          return resolve();
        });
      });
    }

    const {
      correoPropietario,
      tipoInmueble,
      operacion,
      direccion,
      habitaciones,
      banos,
      areaM2,
      descripcion,
      precioCanon,
      imagenUrl,
      usuarioId: bodyUsuarioId,
      autoPublish: bodyAutoPublish
    } = req.body;

  // Preferir usuario autenticado (req.user.id), sino fallback a header/body para compatibilidad
  const headerUsuarioId = req.headers['x-usuario-id'] || req.headers['x-usuarioid'];
  const usuarioId = (req.user && req.user.id) || headerUsuarioId || bodyUsuarioId;

    if (!direccion || !precioCanon) {
      return res.status(400).json({ error: "Dirección y precio son obligatorios." });
    }

    let propietarioId = null;

    // Si llegó un archivo multipart, definir imagenUrl a la ruta pública
    let finalImagenUrl = imagenUrl || null;
    let finalThumbnailUrl = null;
    if (req.file && req.file.filename) {
      finalImagenUrl = `/uploads/${req.file.filename}`;
      try {
        // generar miniatura 400x300
        const thumbName = `thumb-${req.file.filename}`;
        const thumbPath = path.join(uploadsDir, thumbName);
        await sharp(req.file.path)
          .resize(400, 300, { fit: 'cover' })
          .toFile(thumbPath);
        finalThumbnailUrl = `/uploads/${thumbName}`;
      } catch (thumbErr) {
        console.warn('No se pudo generar thumbnail:', thumbErr && thumbErr.message ? thumbErr.message : thumbErr);
        // no bloquear creación si thumbnail falla
      }
    }

    // autoPublish puede venir en body o en header 'x-auto-publish'
    const headerAuto = req.headers['x-auto-publish'];
    const autoPublish = (typeof bodyAutoPublish !== 'undefined') ? (bodyAutoPublish === 'true' || bodyAutoPublish === true) : (headerAuto === 'true' || headerAuto === true);
    const estadoPublicacion = autoPublish ? 'PUBLICADO' : 'EN_REVISION';

    if (usuarioId) {
      // Validar que el usuario exista y sea propietario activo
      const uRes = await dbQuery(
        `SELECT id, rol, activo FROM public.usuarios WHERE id = $1 LIMIT 1`,
        [usuarioId]
      );
      if (uRes.rows.length === 0 || uRes.rows[0].rol !== 'PROPIETARIO' || uRes.rows[0].activo !== true) {
        return res.status(400).json({ error: "Usuario propietario no válido o inactivo." });
      }
      propietarioId = uRes.rows[0].id;
    } else if (correoPropietario) {
      // Mantener compatibilidad: buscar por correoPropietario
      const uRes = await dbQuery(
        `SELECT id FROM public.usuarios 
         WHERE correo = $1 AND rol = 'PROPIETARIO' AND activo = TRUE
         LIMIT 1`,
        [correoPropietario]
      );
      if (uRes.rows.length === 0) {
        return res.status(400).json({ error: "Propietario no válido o inactivo." });
      }
      propietarioId = uRes.rows[0].id;
    } else {
      return res.status(400).json({ error: "Se requiere usuarioId (header/body) o correoPropietario." });
    }

    const insertQuery = `
      INSERT INTO public.propiedades (
        propietario_id,
        tipo_inmueble,
        operacion,
        direccion,
        habitaciones,
        banos,
        area_m2,
        descripcion,
        precio_canon,
        imagen_url,
        thumbnail_url,
        estado_publicacion
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *;
    `;

    const result = await dbQuery(insertQuery, [
      propietarioId,
      tipoInmueble || 'APARTAMENTO',
      operacion || 'ARRIENDO',
      direccion,
      Number(habitaciones || 0),
      Number(banos || 0),
      Number(areaM2 || 0),
      descripcion || null,
      precioCanon,
      finalImagenUrl || null,
      finalThumbnailUrl || null,
      estadoPublicacion
    ]);

    return res.status(201).json({
      message: "Propiedad registrada correctamente.",
      propiedad: result.rows[0]
    });

  } catch (e) {
    console.error("❌ Error POST /propiedades:", e);
    // En desarrollo, devolver detalle del error para facilitar debugging.
    const dev = (process.env.NODE_ENV || '').toLowerCase() !== 'production';
    const resp = { error: "Error registrando propiedad." };
    if (dev) resp.detail = e && e.message ? e.message : String(e);
    return res.status(500).json(resp);
  }
});

// =======================================
// PUT ACTUALIZAR PROPIEDAD
// =======================================
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tipoInmueble,
      operacion,
      direccion,
      habitaciones,
      banos,
      areaM2,
      descripcion,
      precioCanon,
      imagenUrl,
      activa
    } = req.body;

    const checkQuery = `SELECT propietario_id FROM public.propiedades WHERE id = $1`;
    const checkResult = await dbQuery(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Propiedad no encontrada" });
    }

    // Verificar propiedad pertenece al usuario autenticado
    const propietarioId = checkResult.rows[0].propietario_id;
    if (req.user && Number(req.user.id) !== Number(propietarioId)) {
      return res.status(403).json({ error: 'No autorizado: no eres el propietario' });
    }

    const updateFields = [];
    const params = [];
    let paramCount = 1;

    if (tipoInmueble !== undefined) {
      updateFields.push(`tipo_inmueble = $${paramCount++}`);
      params.push(tipoInmueble);
    }
    if (operacion !== undefined) {
      updateFields.push(`operacion = $${paramCount++}`);
      params.push(operacion);
    }
    if (direccion !== undefined) {
      updateFields.push(`direccion = $${paramCount++}`);
      params.push(direccion);
    }
    if (habitaciones !== undefined) {
      updateFields.push(`habitaciones = $${paramCount++}`);
      params.push(Number(habitaciones));
    }
    if (banos !== undefined) {
      updateFields.push(`banos = $${paramCount++}`);
      params.push(Number(banos));
    }
    if (areaM2 !== undefined) {
      updateFields.push(`area_m2 = $${paramCount++}`);
      params.push(Number(areaM2));
    }
    if (descripcion !== undefined) {
      updateFields.push(`descripcion = $${paramCount++}`);
      params.push(descripcion);
    }
    if (precioCanon !== undefined) {
      updateFields.push(`precio_canon = $${paramCount++}`);
      params.push(precioCanon);
    }
    if (imagenUrl !== undefined) {
      updateFields.push(`imagen_url = $${paramCount++}`);
      params.push(imagenUrl);
    }
    if (activa !== undefined) {
      updateFields.push(`activa = $${paramCount++}`);
      params.push(activa);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No hay campos para actualizar" });
    }

    updateFields.push(`actualizado_en = NOW()`);
    params.push(id);

    const updateQuery = `
      UPDATE public.propiedades
      SET ${updateFields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await dbQuery(updateQuery, params);
    res.json(result.rows[0]);
  } catch (e) {
    console.error("❌ Error PUT /propiedades/:id:", e);
    res.status(500).json({ error: "Error actualizando propiedad" });
  }
});

// =======================================
// DELETE ELIMINAR PROPIEDAD (Soft delete)
// =======================================
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar el propietario antes de soft-delete
    const check = await dbQuery('SELECT propietario_id FROM public.propiedades WHERE id = $1 LIMIT 1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Propiedad no encontrada' });
    if (req.user && Number(req.user.id) !== Number(check.rows[0].propietario_id)) {
      return res.status(403).json({ error: 'No autorizado: no eres el propietario' });
    }

    const query = `
      UPDATE public.propiedades
      SET activa = FALSE, actualizado_en = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await dbQuery(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Propiedad no encontrada" });
    }

    res.json({ message: "Propiedad eliminada correctamente", propiedad: result.rows[0] });
  } catch (e) {
    console.error("❌ Error DELETE /propiedades/:id:", e);
    res.status(500).json({ error: "Error eliminando propiedad" });
  }
});

// Manejar errores de multer/archivo y devolver mensajes amigables
router.use((err, req, res, next) => {
  if (!err) return next();
  console.error('Router error handler:', err && err.message ? err.message : err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: `El archivo excede el tamaño máximo de ${MAX_FILE_BYTES / (1024 * 1024)}MB.` });
  }
  if (err.code === 'LIMIT_FILE_TYPE') {
    return res.status(400).json({ error: err.message || 'Tipo de archivo no permitido.' });
  }
  // Pasar al handler global si no es un error que manejemos aquí
  return next(err);
});

// =======================================
// POST Publicar propiedad (cambiar estado a PUBLICADO)
// Requiere X-Usuario-Id header o usuarioId en body y que el usuario sea propietario de la propiedad
// =======================================
router.post("/:id/publish", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    // Preferir usuario autenticado
    const usuarioId = (req.user && req.user.id) || (req.body && req.body.usuarioId) || req.headers['x-usuario-id'] || req.headers['x-usuarioid'];

    if (!usuarioId) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }

    // Verificar existencia y propiedad
    const check = await dbQuery('SELECT id, propietario_id FROM public.propiedades WHERE id = $1 LIMIT 1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }

    const prop = check.rows[0];
    if (Number(prop.propietario_id) !== Number(usuarioId)) {
      return res.status(403).json({ error: 'No autorizado: no eres el propietario de esta propiedad' });
    }

    const upd = await dbQuery(
      `UPDATE public.propiedades SET estado_publicacion = 'PUBLICADO', activa = TRUE, actualizado_en = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    res.json({ ok: true, message: 'Propiedad publicada', propiedad: upd.rows[0] });
  } catch (e) {
    console.error('❌ Error POST /propiedades/:id/publish:', e);
    res.status(500).json({ error: 'Error publicando propiedad' });
  }
});

export default router;