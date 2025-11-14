// index.js (Actualización de Rutas)
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// --- COMENTAMOS ESTO PARA QUE NO PIDA BASE DE DATOS ---
// import pool from './db.js';
// import { dbQuery } from './dbQuery.js';

const app = express();
app.use(express.json());

// Configurar ruta absoluta para servir archivos estáticos (TU FRONTEND)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// --- RUTA PRINCIPAL (HOME) ---
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- RUTA DEL DASHBOARD (El dashboard original restaurado) ---
app.get('/dashboard', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// --- NUEVA RUTA DE MENÚ EXPLORAR (La página con filtros y listado) ---
app.get('/explorar-menu', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'explorar-menu.html'));
});

// --- RUTAS DE SALUD (SIMPLIFICADA) ---
app.get('/health', (_req, res) => res.json({ ok: true, mode: 'frontend-only' }));

// --- RUTAS DE USUARIOS (SIMULADAS / MOCK) ---
app.get('/usuarios', async (_req, res) => {
    res.json([
        { id: 1, nombre: "Usuario Prueba 1", correo: "test1@inmoapp.com" },
        { id: 2, nombre: "Usuario Prueba 2", correo: "test2@inmoapp.com" }
    ]);
});

// --- PUERTO Y SERVIDOR ---
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🎨 MODO FRONTEND: Servidor corriendo en http://localhost:${PORT}`);
});