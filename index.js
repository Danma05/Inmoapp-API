// index.js - MODO MOCK (SIN BASE DE DATOS) + RUTA NUEVA
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// --- BASE DE DATOS DESHABILITADA ---
// import pool from "./db.js";
// import { dbQuery } from "./dbQuery.js";

const app = express();
app.use(express.json());

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
app.get("/postulaciones", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "postulaciones.html"));
});

//  ruta mensajes
app.get("/mensajes", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "mensajes.html"));
});

// --- RUTA MI CUENTA ---
app.get("/cuenta", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "cuenta.html"));
});

// ------------------------------------------------------------
// API MOCK (SIMULADA - PARA QUE EL FRONTEND NO FALLE)
// ------------------------------------------------------------

app.get("/health", (_req, res) => {
  res.json({ ok: true, mode: "mock" });
});

app.get("/health/db", (_req, res) => {
  res.json({ ok: true, db: "mocked_connected", now: new Date().toISOString() });
});

// GET /usuarios (Simulado)
app.get("/usuarios", (_req, res) => {
  res.json([
    { id: 1, nombre_completo: "Usuario Mock", correo: "test@mock.com" }
  ]);
});

// POST /usuarios (Simulado)
app.post("/usuarios", (req, res) => {
  const { nombreCompleto, correo, rol } = req.body;
  console.log("📝 [MOCK] Creando usuario:", { nombreCompleto, correo });

  setTimeout(() => {
    res.status(201).json({
      id: Date.now(),
      nombre_completo: nombreCompleto,
      correo: correo,
      rol: rol || 'ARRENDATARIO',
      creado_en: new Date()
    });
  }, 300);
});

// POST /passport/init (Simulado)
app.post("/passport/init", (req, res) => {
  const { usuarioId } = req.body;
  console.log(`🛂 [MOCK] Inicializando pasaporte para usuario ${usuarioId}`);
  
  res.status(201).json({
    id: 100,
    usuario_id: usuarioId,
    progreso_porcentaje: 0,
    completado: false
  });
});

// POST /passport/document (Simulado)
app.post("/passport/document", (req, res) => {
  const { usuarioId, tipoDocumento } = req.body;
  console.log(`📄 [MOCK] Documento subido: ${tipoDocumento} (Usuario: ${usuarioId})`);

  res.status(201).json({
    documento: {
      id: Math.floor(Math.random() * 1000),
      nombre_archivo: "archivo_mock.pdf",
      tipo_documento: tipoDocumento
    },
    pasaporte: {
      usuario_id: usuarioId,
      tiene_doc_identidad: tipoDocumento === 'IDENTIDAD',
      tiene_solvencia: tipoDocumento === 'SOLVENCIA',
      tiene_ingresos: tipoDocumento === 'INGRESOS',
      tiene_otros: tipoDocumento === 'OTROS',
      progreso_porcentaje: 25,
      actualizado_en: new Date()
    }
  });
});

// ------------------------------------------------------------
// SERVIDOR
// ------------------------------------------------------------
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Servidor MOCK corriendo en http://localhost:${PORT}`);
  console.log("⚠️  NO hay conexión a base de datos real. Todo es simulado.\n");
});

process.on("SIGINT", () => {
  console.log("\n👋 Cerrando servidor...");
  server.close(() => process.exit(0));
});