// index.js – API completa con frontend + pg + reintentos + healthcheck.
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./db.js";        // usa tu versión avanzada
import { dbQuery } from "./dbQuery.js"; // usa tu versión avanzada

const app = express();
app.use(express.json());

// ------------------------------------------------------------
// STATIC / FRONTEND
// ------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/dashboard", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// ------------------------------------------------------------
// HEALTHCHECKS
// ------------------------------------------------------------
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "InmoApp API", mode: "full" });
});

app.get("/health/db", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() now");
    res.json({ ok: true, db: "connected", now: result.rows[0].now });
  } catch (e) {
    console.error("❌ Error en health/db:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ------------------------------------------------------------
// API: USUARIOS
// ------------------------------------------------------------

// GET usuarios
app.get("/usuarios", async (_req, res) => {
  try {
    const result = await dbQuery("SELECT * FROM usuarios ORDER BY id DESC");
    res.json(result.rows);
  } catch (e) {
    console.error("❌ Error GET /usuarios:", e);
    res.status(500).json({ error: "Error obteniendo usuarios" });
  }
});

// POST usuario
app.post("/usuarios", async (req, res) => {
  try {
    const {
      nombreCompleto,
      correo,
      telefono,
      rol,              // 'ARRENDATARIO' o 'PROPIETARIO'
      aceptaTerminos,   // true / false
      password          // viene del frontend
    } = req.body;

    const query = `
      INSERT INTO usuarios (
        nombre_completo,
        correo,
        telefono,
        rol,
        acepta_terminos,
        password_hash
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const values = [
      nombreCompleto,
      correo,
      telefono,
      rol,
      !!aceptaTerminos,
      password // ⚠️ por ahora texto plano; luego se cambia a hash
    ];

    const result = await dbQuery(query, values);
    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error("❌ Error POST /usuarios:", e);
    res.status(500).json({ error: "Error creando usuario" });
  }
});


app.post("/passport/init", async (req, res) => {
  try {
    const { usuarioId } = req.body;

    // Crea el pasaporte solo si no existe
    const query = `
      INSERT INTO pasaportes_arrendatario (usuario_id)
      VALUES ($1)
      ON CONFLICT (usuario_id) DO UPDATE
      SET actualizado_en = NOW()
      RETURNING *;
    `;

    const result = await dbQuery(query, [usuarioId]);
    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error("❌ Error POST /passport/init:", e);
    res.status(500).json({ error: "Error inicializando pasaporte" });
  }
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


// ------------------------------------------------------------
// SERVER
// ------------------------------------------------------------
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`⚡ InmoApp API corriendo en puerto ${PORT}`);
});

// ------------------------------------------------------------
// SHUTDOWN ELEGANTE
// ------------------------------------------------------------
async function shutdown(signal) {
  console.log(`\n⛔ ${signal} recibido. Cerrando servidor...`);

  server.close(async () => {
    try {
      console.log("⏳ Cerrando pool PostgreSQL...");
      await pool.end();
      console.log("✅ Pool cerrado.");
      process.exit(0);
    } catch (err) {
      console.error("❌ Error cerrando pool:", err);
      process.exit(1);
    }
  });
}

["SIGINT", "SIGTERM"].forEach(sig =>
  process.on(sig, () => shutdown(sig))
);
