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

// --- RUTAS PRINCIPALES ---

app.get("/", (_req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/dashboard", (_req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("/explorar-menu", (_req, res) => {
    res.sendFile(path.join(__dirname, "public", "explorar-menu.html"));
});

// 🚨 RUTA AGREGADA PARA LA PÁGINA DE DETALLE DE PROPIEDAD 🚨
app.get("/propiedad-detalle", (_req, res) => {
    res.sendFile(path.join(__dirname, "public", "propiedad-detalle.html"));
});

app.get("/favoritos", (_req, res) => {
    res.sendFile(path.join(__dirname, "public", "favoritos.html"));
});

app.get("/visitas", (_req, res) => {
    res.sendFile(path.join(__dirname, "public", "visitas.html"));
});

app.get("/postulaciones", (_req, res) => {
    res.sendFile(path.join(__dirname, "public", "postulaciones.html"));
});

app.get("/mensajes", (_req, res) => {
    res.sendFile(path.join(__dirname, "public", "mensajes.html"));
});

app.get("/cuenta", (_req, res) => {
    res.sendFile(path.join(__dirname, "public", "cuenta.html"));
});

app.get("/dashboard-propietario", (_req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard-propietario.html"));
});

// --- Rutas Admin (Limpieza de duplicados) ---
app.get('/admin-login', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});
app.get('/admin-dashboard', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});
app.get('/admin-agentes', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-agentes.html'));
});
app.get('/admin-propiedades', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-propiedades.html'));
});
app.get('/admin-solicitudes', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-solicitudes.html'));
});
app.get('/admin-leads', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-leads.html'));
});
app.get('/admin-contratos', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-contratos.html'));
});
app.get('/admin-chat', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-chat.html'));
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

// POST /passport/document (Simulado, basado en la estructura de DBQuery)
app.post("/passport/document", async (req, res) => {
    // ESTE ES UN MOCK ASÍNCRONO, IGNORANDO LA LÓGICA DE DB REAL
    try {
        const { usuarioId, tipoDocumento } = req.body;

        // Simulación de actualización de flags y progreso
        let progreso = 25; // Simulación simple de avance
        if (tipoDocumento === 'IDENTIDAD') progreso = 25;
        if (tipoDocumento === 'SOLVENCIA') progreso = 50;
        if (tipoDocumento === 'INGRESOS') progreso = 75;
        if (tipoDocumento === 'OTROS') progreso = 100;

        res.status(201).json({
            documento: {
                id: Math.floor(Math.random() * 1000),
                nombre_archivo: "archivo_mock.pdf",
                tipo_documento: tipoDocumento
            },
            pasaporte: {
                usuario_id: usuarioId,
                progreso_porcentaje: progreso,
                completado: progreso === 100,
                actualizado_en: new Date()
            }
        });
    } catch (e) {
        console.error("❌ Error POST /passport/document mock:", e);
        res.status(500).json({ error: "Error simulado registrando documento" });
    }
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