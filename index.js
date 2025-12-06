// index.js - Servidor Principal InmoApp
import 'dotenv/config';
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from 'cors';

// --- BASE DE DATOS CONECTADA ---
import { dbQuery } from "./dbQuery.js";

// --- ROUTERS ---
import authRouter from "./routers/auth.js";
import propiedadesRouter from "./routers/propiedades.js";
import favoritosRouter from "./routers/favoritos.js";
import visitasRouter from "./routers/visitas.js";
import postulacionesRouter from "./routers/postulaciones.js";
import mensajesRouter from "./routers/mensajes.js";
import usuariosRouter from "./routers/usuarios.js";
import notificacionesRouter from "./routers/notificaciones.js";
import passportRouter from "./routers/passport.js";
import contratosRouter from "./routers/contratos.js";


const app = express();
app.use(express.json());
// Habilitar CORS (ajusta el origen según tu entorno de despliegue)
app.use(cors({ origin: true, credentials: true }));

// ------------------------------------------------------------
// CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS Y RUTAS DE PÁGINAS
// ------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir carpeta public (CSS, JS, Imágenes)
app.use(express.static(path.join(__dirname, "public")));

// Rutas de Pantallas
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/dashboard", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// --- NUEVA RUTA PARA EL MENÚ DE EXPLORACIÓN ---
app.get("/explorar-menu", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "explorar-menu.html"));
});

// RUTA FAVORITOS
app.get("/favoritos", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "favoritos.html"));
});

//ruta visitas
app.get("/visitas", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "visitas.html"));
});

// ruta postulaciones
app.get("/postulaciones", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "postulaciones.html"));
});

//  ruta contratos
app.get("/contratos", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "contratos.html")); 
});

//  ruta mensajes
app.get("/mensajes", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "mensajes.html"));
});

// --- RUTA MI CUENTA ---
app.get("/cuenta", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "cuenta.html"));
});

// --- Dashboard PropietarioX---
app.get("/dashboard-propietario", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard-propietario.html"));
});

app.get("/propiedades-detalles", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "propiedades-detalles.html"));
});

// ------------------------------------------------------------
// ENDPOINTS DE SALUD Y ESTADO
// ------------------------------------------------------------

app.get("/health", (_req, res) => {
  res.json({ ok: true, mode: "production", timestamp: new Date().toISOString() });
});

app.get("/health/db", async (_req, res) => {
  try {
    await dbQuery("SELECT 1");
    res.json({ ok: true, db: "connected", now: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ ok: false, db: "disconnected", error: e.message });
  }
});

// =======================================
// RUTAS API
// =======================================

// Autenticación y registro
app.use("/", authRouter);

// Propiedades
app.use("/propiedades", propiedadesRouter);

// Favoritos (API mounted under /api to avoid conflict with page route)
app.use("/api/favoritos", favoritosRouter);

// Visitas
app.use('/api/visitas', visitasRouter);

// Postulaciones
app.use('/api/postulaciones', postulacionesRouter);

// Mensajes
app.use("/api/mensajes", mensajesRouter);

// Contratos
app.use("/api/contratos", contratosRouter);

// Usuarios y perfil
app.use("/usuarios", usuariosRouter);

// Notificaciones
app.use("/notificaciones", notificacionesRouter);

// Pasaporte del arrendatario
app.use("/passport", passportRouter);

// Rutas de administración
//app.use('/admin', adminRouter);


// ------------------------------------------------------------
// SERVIDOR
// ------------------------------------------------------------
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Servidor InmoApp corriendo en el puerto ${PORT}`);
  console.log(`🌐 URL: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
  console.log("✅ Base de datos PostgreSQL conectada\n");
});

process.on("SIGINT", () => {
  console.log("\n👋 Cerrando servidor...");
  server.close(() => process.exit(0));
});

// Handler global de errores (captura errores no manejados en middlewares)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});