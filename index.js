// index.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const app = express();
app.use(express.json());

// estáticos
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// home
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// health API
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// health DB
app.get('/health/db', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() now');
    res.json({ ok: true, now: rows[0].now });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// listar usuarios
app.get('/usuarios', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM usuarios ORDER BY id DESC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Error consultando usuarios' });
  }
});

// crear usuario
app.post('/usuarios', async (req, res) => {
  try {
    const { nombre, correo, telefono } = req.body;
    const q = 'INSERT INTO usuarios (nombre, correo, telefono) VALUES ($1,$2,$3) RETURNING *';
    const { rows } = await pool.query(q, [nombre, correo, telefono]);
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Error insertando usuario' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API en puerto ${PORT}`));
