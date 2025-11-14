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
    const { nombre, correo, telefono } = req.body;

    const query = `
      INSERT INTO usuarios (nombre, correo, telefono)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

    const values = [nombre, correo, telefono];
    const result = await dbQuery(query, values);

    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error("❌ Error POST /usuarios:", e);
    res.status(500).json({ error: "Error creando usuario" });
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
