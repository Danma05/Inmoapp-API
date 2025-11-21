// index.js - MODO MOCK (SIN BASE DE DATOS) + RUTA NUEVA
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// --- BASE DE DATOS DESHABILITADA ---
 import pool from "./db.js";
 import { dbQuery } from "./dbQuery.js";

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

// --- Dashboard PropietarioX---
app.get("/dashboard-propietario", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard-propietario.html"));
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
app.get("/usuarios", async (_req, res) => {
  try {
    const result = await dbQuery("SELECT * FROM usuarios ORDER BY id ASC");
    res.json(result.rows);
  } catch (e) {
    console.error("❌ Error GET /usuarios:", e);
    res.status(500).json({ error: "Error consultando usuarios" });
  }
});


// =======================================
// LOGIN DE USUARIO
// =======================================
app.post("/login", async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ error: "Correo y contraseña son obligatorios." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({ error: "El correo electrónico no es válido." });
    }

    // Buscar usuario por correo
    const query = `
      SELECT id, nombre_completo, correo, rol, password_hash, activo
      FROM public.usuarios
      WHERE correo = $1
      LIMIT 1;
    `;
    const result = await dbQuery(query, [correo]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos." });
    }

    const user = result.rows[0];

    // Validar si está activo
    if (user.activo === false) {
      return res.status(403).json({ error: "Tu cuenta está inactiva. Contacta al administrador." });
    }

    // ⚠ De momento comparamos texto plano (para el curso está bien).
    // Más adelante se puede reemplazar por bcrypt.compare(...)
    if (password !== user.password_hash) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos." });
    }

    // Actualizar último acceso (opcional)
    await dbQuery(
      "UPDATE public.usuarios SET ultimo_acceso = NOW() WHERE id = $1;",
      [user.id]
    );

    return res.json({
      ok: true,
      usuario: {
        id: user.id,
        nombre_completo: user.nombre_completo,
        correo: user.correo,
        rol: user.rol
      }
    });

  } catch (e) {
    console.error("❌ Error POST /login:", e);
    return res.status(500).json({ error: "Error interno al iniciar sesión." });
  }
});


// POST /usuarios (Simulado)
app.post("/usuarios", async (req, res) => {
  try {
    const {
      nombre,          // string
      apellido,        // string
      correo,          // string
      telefono,        // string (opcional)
      password,        // string
      aceptaTerminos,  // boolean
      rol              // 'ARRENDATARIO' | 'PROPIETARIO' ...
    } = req.body;

    // ---------- Validaciones de backend ----------
    if (!nombre || !apellido || !correo || !password) {
      return res.status(400).json({ error: "Todos los campos obligatorios deben estar completos." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({ error: "El correo electrónico no es válido." });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "La contraseña debe tener mínimo 8 caracteres." });
    }

    if (!aceptaTerminos) {
      return res.status(400).json({ error: "Debes aceptar los términos y condiciones." });
    }

    const nombreCompleto = `${nombre.trim()} ${apellido.trim()}`.trim();
    const rolFinal = rol || "ARRENDATARIO";

    // ⚠ En producción deberías encriptar esta contraseña y guardar el hash en password_hash
    const passwordHash = password;

    const insertQuery = `
      INSERT INTO public.usuarios (
        nombre_completo,
        correo,
        telefono,
        rol,
        password_hash,
        acepta_terminos,
        activo
      )
      VALUES ($1, $2, $3, $4, $5, $6, TRUE)
      RETURNING id, nombre_completo, correo, telefono, rol, acepta_terminos, activo, creado_en;
    `;

    const result = await dbQuery(insertQuery, [
      nombreCompleto,
      correo,
      telefono || null,
      rolFinal,
      passwordHash,
      true // acepta_terminos
    ]);

    return res.status(201).json({
      message: "Usuario registrado correctamente.",
      usuario: result.rows[0]
    });

  } catch (e) {
    console.error("❌ Error POST /usuarios:", e);
    return res.status(500).json({ error: "Error registrando usuario." });
  }
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

app.post("/passport/document", async (req, res) => {
  try {
    const {
      usuarioId,
      tipoDocumento,   // 'IDENTIDAD' | 'SOLVENCIA' | 'INGRESOS' | 'OTROS'
      nombreArchivo,
      rutaArchivo,
      mimeType,
      tamanoBytes
    } = req.body;

    // 1) Guardar registro del documento
    const insertDocQuery = `
      INSERT INTO documentos_arrendatario (
        usuario_id, tipo_documento, nombre_archivo, ruta_archivo, mime_type, tamano_bytes
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const docResult = await dbQuery(insertDocQuery, [
      usuarioId,
      tipoDocumento,
      nombreArchivo,
      rutaArchivo,
      mimeType,
      tamanoBytes
    ]);

    // 2) Actualizar flags del pasaporte según tipoDocumento
    let column;
    if (tipoDocumento === "IDENTIDAD") column = "tiene_doc_identidad";
    if (tipoDocumento === "SOLVENCIA") column = "tiene_solvencia";
    if (tipoDocumento === "INGRESOS") column = "tiene_ingresos";
    if (tipoDocumento === "OTROS") column = "tiene_otros";

    const updateFlagsQuery = `
      UPDATE pasaportes_arrendatario
      SET ${column} = TRUE,
          actualizado_en = NOW()
      WHERE usuario_id = $1
      RETURNING tiene_doc_identidad, tiene_solvencia, tiene_ingresos, tiene_otros;
    `;
    const passportFlags = await dbQuery(updateFlagsQuery, [usuarioId]);
    const flags = passportFlags.rows[0];

    // 3) Recalcular progreso (25% por documento)
    const countTrue = [
      flags.tiene_doc_identidad,
      flags.tiene_solvencia,
      flags.tiene_ingresos,
      flags.tiene_otros
    ].filter(Boolean).length;

    const progreso = countTrue * 25;

    const updateProgressQuery = `
      UPDATE pasaportes_arrendatario
      SET progreso_porcentaje = $1,
          completado = ($1 = 100),
          actualizado_en = NOW()
      WHERE usuario_id = $2
      RETURNING *;
    `;
    const passportUpdated = await dbQuery(updateProgressQuery, [progreso, usuarioId]);

    res.status(201).json({
      documento: docResult.rows[0],
      pasaporte: passportUpdated.rows[0]
    });
  } catch (e) {
    console.error("❌ Error POST /passport/document:", e);
    res.status(500).json({ error: "Error registrando documento" });
  }
});

// =======================================
// CREAR PROPIEDAD (PROPIETARIO)
// =======================================
app.post("/propiedades", async (req, res) => {
  try {
    const {
      correoPropietario,
      tipoInmueble,
      operacion,
      direccion,
      habitaciones,
      banos,
      areaM2,
      descripcion,
      precioCanon,
      imagenUrl
    } = req.body;

    if (!correoPropietario || !direccion || !precioCanon) {
      return res.status(400).json({ error: "Correo, dirección y precio son obligatorios." });
    }

    // Buscar propietario por correo
    const uRes = await dbQuery(
      `SELECT id FROM public.usuarios 
       WHERE correo = $1 AND rol = 'PROPIETARIO' AND activo = TRUE
       LIMIT 1`,
      [correoPropietario]
    );

    if (uRes.rows.length === 0) {
      return res.status(400).json({ error: "Propietario no válido o inactivo." });
    }

    const propietarioId = uRes.rows[0].id;

    const insertQuery = `
      INSERT INTO public.propiedades (
        propietario_id,
        tipo_inmueble,
        operacion,
        direccion,
        habitaciones,
        banos,
        area_m2,
        descripcion,
        precio_canon,
        imagen_url
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *;
    `;

    const result = await dbQuery(insertQuery, [
      propietarioId,
      tipoInmueble || 'APARTAMENTO',
      operacion || 'ARRIENDO',
      direccion,
      Number(habitaciones || 0),
      Number(banos || 0),
      Number(areaM2 || 0),
      descripcion || null,
      precioCanon,
      imagenUrl || null
    ]);

    return res.status(201).json({
      message: "Propiedad registrada correctamente.",
      propiedad: result.rows[0]
    });

  } catch (e) {
    console.error("❌ Error POST /propiedades:", e);
    return res.status(500).json({ error: "Error registrando propiedad." });
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