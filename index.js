// index.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
import { dbQuery } from './dbQuery.js';

const app = express();
app.use(express.json());

// Configurar ruta absoluta para servir archivos estáticos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// --- RUTA PRINCIPAL (HTML) ---
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- RUTAS DE SALUD ---
app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/health/db', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() now');
    res.json({ ok: true, now: rows[0].now });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- RUTAS DE USUARIOS ---
app.get('/usuarios', async (_req, res) => {
  try {
    const { rows } = await dbQuery('SELECT * FROM usuarios ORDER BY id DESC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
});

app.post('/usuarios', async (req, res) => {
  try {
    const { nombre, correo, telefono } = req.body;
    const query = `
      INSERT INTO usuarios (nombre, correo, telefono)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const { rows } = await dbQuery(query, [nombre, correo, telefono]);
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Error insertando usuario' });
  }
});

// --- PUERTO Y SERVIDOR ---
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 API corriendo en puerto ${PORT}`);
});

// --- CIERRE ELEGANTE ---
async function shutdown(signal) {
  try {
    console.log(`\n🛎 ${signal} recibido. Cerrando servidor...`);
    await new Promise(res => server.close(res));
    console.log('🔒 Servidor cerrado. Cerrando pool de BD...');
    await pool.end();
    console.log('✅ Pool cerrado. Bye.');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error en shutdown:', e);
    process.exit(1);
  }
}
['SIGTERM', 'SIGINT'].forEach(sig => process.on(sig, () => shutdown(sig)));
