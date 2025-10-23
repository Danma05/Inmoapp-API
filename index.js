import express from "express";
const app = express();

app.use(express.json());

// Endpoint de prueba
app.get("/", (req, res) => {
  res.send("Servidor InmoApp activo 🚀");
});

// Endpoint de salud (Render lo usa para verificar que el server está vivo)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Endpoint ejemplo para IA (puedes conectarlo luego con OpenAI)
app.post("/ai/chat", async (req, res) => {
  const { question } = req.body;
  res.json({ response: `Recibí tu pregunta: ${question}` });
});

// Puerto dinámico (Render usa process.env.PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API corriendo en http://localhost:${PORT}`));
