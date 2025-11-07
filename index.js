import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./db.js"; // 👈 importa la conexión

const app = express();
app.use(express.json());

// Configuración para archivos estáticos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// Endpoint de prueba
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Endpoint de salud
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Ejemplo: consultar la base de datos
app.get("/usuarios", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM usuarios");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error consultando la base de datos" });
  }
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ API corriendo en el puerto ${PORT}`));
