// routers/passport.js - Pasaporte del arrendatario
import express from "express";
import { dbQuery } from "../dbQuery.js";

const router = express.Router();

// =======================================
// POST Inicializar pasaporte
// =======================================
router.post("/init", async (req, res) => {
  try {
    const { usuarioId } = req.body;
    
    if (!usuarioId) {
      return res.status(400).json({ error: "usuarioId es obligatorio" });
    }

    // Verificar si ya existe un pasaporte
    const existing = await dbQuery(
      "SELECT id FROM pasaportes_arrendatario WHERE usuario_id = $1",
      [usuarioId]
    );

    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]);
    }

    // Crear nuevo pasaporte
    const result = await dbQuery(
      `INSERT INTO pasaportes_arrendatario (usuario_id, progreso_porcentaje, completado)
       VALUES ($1, 0, FALSE)
       RETURNING *`,
      [usuarioId]
    );

    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error("❌ Error POST /passport/init:", e);
    res.status(500).json({ error: "Error inicializando pasaporte" });
  }
});

// =======================================
// POST Subir documento
// =======================================
router.post("/document", async (req, res) => {
  try {
    const {
      usuarioId,
      tipoDocumento,
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

export default router;

