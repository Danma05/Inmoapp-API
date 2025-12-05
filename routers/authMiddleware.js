import jwt from 'jsonwebtoken';

// Middleware para verificar JWT en Authorization: Bearer <token>
export function authenticate(req, res, next) {
  try {
    const auth = req.headers['authorization'] || req.headers['Authorization'];
    if (!auth) return next(); // no token -> let route decide (some routes may still accept header fallback)

    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Token inválido' });

    const token = parts[1];
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';

    const payload = jwt.verify(token, secret);
    // Attach minimal user info to request
    req.user = { id: payload.id, correo: payload.correo, rol: payload.rol };
    return next();
  } catch (e) {
    console.error('❌ JWT verification error:', e && e.message ? e.message : e);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export default authenticate;
