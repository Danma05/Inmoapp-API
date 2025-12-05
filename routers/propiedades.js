// routers/propiedades.js - Gestión de propiedades
import express from "express";
import { dbQuery } from "../dbQuery.js";

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

    // Contar total
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
router.get("/mis-propiedades", async (req, res) => {
  try {
    const { usuarioId } = req.query;

    if (!usuarioId) {
      return res.status(400).json({ error: "usuarioId es obligatorio" });
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
// POST CREAR PROPIEDAD
// =======================================
router.post("/", async (req, res) => {
  try {
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
      imagenUrl
    } = req.body;

    if (!correoPropietario || !direccion || !precioCanon) {
      return res.status(400).json({ error: "Correo, dirección y precio son obligatorios." });
    }

    const uRes = await dbQuery(
      `SELECT id FROM public.usuarios 
       WHERE correo = $1 AND rol = 'PROPIETARIO' AND activo = TRUE
       LIMIT 1`,
      [correoPropietario]
    );

    if (uRes.rows.length === 0) {
      return res.status(400).json({ error: "Propietario no válido o inactivo." });
    }

    const propietarioId = uRes.rows[0].id;

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
        imagen_url
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
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
      imagenUrl || null
    ]);

    return res.status(201).json({
      message: "Propiedad registrada correctamente.",
      propiedad: result.rows[0]
    });

  } catch (e) {
    console.error("❌ Error POST /propiedades:", e);
    return res.status(500).json({ error: "Error registrando propiedad." });
  }
});

// =======================================
// PUT ACTUALIZAR PROPIEDAD
// =======================================
router.put("/:id", async (req, res) => {
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
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

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

export default router;