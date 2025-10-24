import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

// Configuración para servir archivos estáticos
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

// Endpoint ejemplo IA
app.post("/ai/chat", async (req, res) => {
  const { question } = req.body;
  res.json({ response: `Recibí tu pregunta: ${question}` });
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API corriendo en http://localhost:${PORT}`));
