import express from "express";
import { dbQuery } from "../dbQuery.js";

const router = express.Router();

// =======================================
// GET Visitas (Filtrado para Usuario o Propietario)
// =======================================
router.get("/", async (req, res) => {
  try {
    const { usuarioId, propietarioId } = req.query;

    if (!usuarioId && !propietarioId) {
      return res.status(400).json({ error: "Falta ID de usuario o propietario" });
    }

    let query = `
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
        
        -- Datos del Propietario (para cuando consulta el inquilino)
        u_prop.nombre_completo as propietario_nombre,
        u_prop.correo as propietario_correo,
        u_prop.telefono as propietario_telefono,

        -- Datos del Inquilino/Visitante (para cuando consulta el dueño)
        u_inq.nombre_completo as inquilino_nombre,
        u_inq.correo as inquilino_correo,
        u_inq.telefono as inquilino_telefono

      FROM public.visitas v
      INNER JOIN public.propiedades p ON v.propiedad_id = p.id
      INNER JOIN public.usuarios u_prop ON p.propietario_id = u_prop.id
      INNER JOIN public.usuarios u_inq ON v.usuario_id = u_inq.id
    `;

    const params = [];

    // Lógica para filtrar
    if (propietarioId) {
        // Si pide el dueño, buscamos visitas a SUS propiedades
        query += ` WHERE p.propietario_id = $1`;
        params.push(propietarioId);
    } else {
        // Si pide el inquilino, buscamos SUS visitas
        query += ` WHERE v.usuario_id = $1`;
        params.push(usuarioId);
    }

    query += ` ORDER BY v.fecha_visita DESC`;

    const result = await dbQuery(query, params);
    res.json(result.rows);
  } catch (e) {
    console.error("❌ Error GET /visitas:", e.message);
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

export default router; // <--- ¡ESTA LÍNEA ES LA QUE FALTABA!