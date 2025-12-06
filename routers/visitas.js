// routers/visitas.js (GET actualizado)
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