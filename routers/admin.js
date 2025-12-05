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

    // Actualizar estado_publicacion y activa para las propiedades indicadas
    const updQuery = `
      UPDATE public.propiedades
      SET estado_publicacion = 'PUBLICADO', activa = TRUE, actualizado_en = NOW()
      WHERE id = ANY($1::int[])
      RETURNING *
    `;

    const result = await dbQuery(updQuery, [ids]);

    return res.json({ ok: true, updated: result.rows.length, propiedades: result.rows });
  } catch (e) {
    console.error('❌ Error POST /admin/propiedades/publish:', e);
    return res.status(500).json({ error: 'Error publicando propiedades en lote' });
  }
});

export default router;
