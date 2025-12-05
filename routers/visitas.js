// routers/visitas.js - VERSIÓN CORREGIDA (SIN COLUMNA CIUDAD)
import express from "express";
import { dbQuery } from "../dbQuery.js";

const router = express.Router();

// =======================================
// GET Visitas del usuario
// =======================================
router.get("/", async (req, res) => {
  try {
    const { usuarioId } = req.query;

    console.log(`📡 Consultando visitas para usuario: ${usuarioId}`);

    if (!usuarioId) {
      return res.status(400).json({ error: "usuarioId es obligatorio" });
    }

    // HE QUITADO 'p.ciudad' y 'p.operacion' PARA EVITAR ERRORES
    // Si quieres ciudad, tendrás que agregarla a la base de datos primero.
    const query = `
      SELECT 
        v.id as visita_id,
        v.fecha_visita,
        v.hora_visita,
        v.estado,
        v.notas,
        p.id as propiedad_id,
        p.direccion,
        p.precio_canon,
        p.imagen_url,
        u.nombre_completo as propietario_nombre,
        u.correo as propietario_correo,
        u.telefono as propietario_telefono
      FROM public.visitas v
      INNER JOIN public.propiedades p ON v.propiedad_id = p.id
      INNER JOIN public.usuarios u ON p.propietario_id = u.id
      WHERE v.usuario_id = $1
      ORDER BY v.fecha_visita DESC
    `;

    const result = await dbQuery(query, [usuarioId]);
    console.log(`✅ Se encontraron ${result.rows.length} visitas`);
    
    res.json(result.rows);
  } catch (e) {
    console.error("❌ Error CRÍTICO en GET /visitas:", e.message);
    res.status(500).json({ error: "Error interno: " + e.message });
  }
});

// =======================================
// POST Crear visita
// =======================================
router.post("/", async (req, res) => {
  try {
    const { usuarioId, propiedadId, fechaVisita, horaVisita, notas } = req.body;

    if (!usuarioId || !propiedadId || !fechaVisita || !horaVisita) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
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
    console.error("❌ Error creando visita:", e.message);
    res.status(500).json({ error: "Error al agendar: " + e.message });
  }
});

// =======================================
// PUT Actualizar visita
// =======================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) return res.status(400).json({ error: "Estado obligatorio" });

    const query = `
      UPDATE public.visitas
      SET estado = $1, actualizado_en = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await dbQuery(query, [estado, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Visita no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (e) {
    console.error("❌ Error actualizando visita:", e);
    res.status(500).json({ error: "Error al actualizar" });
  }
});

export default router;