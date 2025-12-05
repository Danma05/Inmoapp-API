import express from 'express';
import { dbQuery } from '../dbQuery.js';
import { authenticate } from './authMiddleware.js';

const router = express.Router();

// Este endpoint permite a un ADMIN publicar múltiples propiedades en lote.
// POST /admin/propiedades/publish
// Body: { ids: [1,2,3] }
router.post('/propiedades/publish', authenticate, async (req, res) => {
  try {
    // Requiere autenticación y rol ADMIN
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Autenticación requerida' });
    if ((user.rol || '').toUpperCase() !== 'ADMIN') return res.status(403).json({ error: 'Permisos insuficientes' });

    const ids = req.body && req.body.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de ids en el cuerpo: { ids: [1,2,3] }' });
    }

    // Limitar tamaño del lote para evitar abusos
    const MAX_BATCH = 100;
    if (ids.length > MAX_BATCH) {
      return res.status(400).json({ error: `El lote excede el tamaño máximo de ${MAX_BATCH} ids` });
    }

    // Actualizar estado_publicacion y activa para las propiedades indicadas
    const updQuery = `
      UPDATE public.propiedades
      SET estado_publicacion = 'PUBLICADO', activa = TRUE, actualizado_en = NOW()
      WHERE id = ANY($1::int[])
      RETURNING *
    `;

    const result = await dbQuery(updQuery, [ids]);

    // Intentar registrar auditoría (si la tabla existe)
    try {
      const auditQuery = `
        INSERT INTO public.admin_auditoria (admin_id, propiedad_ids, cantidad, creado_en)
        VALUES ($1, $2, $3, NOW())
      `;
      // propiedad_ids almacenadas como text (JSON array)
      await dbQuery(auditQuery, [user.id, JSON.stringify(ids), result.rows.length]);
    } catch (auditErr) {
      // No bloquear el flujo si la tabla de auditoría no existe; loguear para revisión
      console.warn('⚠️ Auditoría no registrada (quizá no existe la tabla admin_auditoria):', auditErr && auditErr.message ? auditErr.message : auditErr);
    }

    return res.json({ ok: true, updated: result.rows.length, propiedades: result.rows });
  } catch (e) {
    console.error('❌ Error POST /admin/propiedades/publish:', e);
    return res.status(500).json({ error: 'Error publicando propiedades en lote' });
  }
});

// GET /admin/auditoria
// Devuelve registros de admin_auditoria. Query params: limit, offset
router.get('/auditoria', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Autenticación requerida' });
    if ((user.rol || '').toUpperCase() !== 'ADMIN') return res.status(403).json({ error: 'Permisos insuficientes' });

    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const offset = Number(req.query.offset) || 0;

    const q = `
      SELECT a.id, a.admin_id, a.propiedad_ids, a.cantidad, a.creado_en, u.nombre_completo as admin_nombre
      FROM public.admin_auditoria a
      LEFT JOIN public.usuarios u ON a.admin_id = u.id
      ORDER BY a.creado_en DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await dbQuery(q, [limit, offset]);
    return res.json({ ok: true, rows: result.rows });
  } catch (e) {
    console.error('❌ Error GET /admin/auditoria:', e);
    return res.status(500).json({ error: 'Error consultando auditoría' });
  }
});

export default router;
