// routers/usuarios.js - Gestión de usuarios y perfil
import express from "express";
import { dbQuery } from "../dbQuery.js";

const router = express.Router();

// =======================================
// GET USUARIOS (Listar todos)
// =======================================
router.get("/", async (req, res) => {
  try {
    const result = await dbQuery("SELECT id, nombre_completo, correo, telefono, rol, activo, creado_en FROM public.usuarios ORDER BY id ASC");
    res.json(result.rows);
  } catch (e) {
    console.error("❌ Error GET /usuarios:", e);
    res.status(500).json({ error: "Error consultando usuarios" });
  }
});

// =======================================
// GET Perfil del usuario
// =======================================
router.get("/perfil", async (req, res) => {
  try {
    const { usuarioId } = req.query;

    if (!usuarioId) {
      return res.status(400).json({ error: "usuarioId es obligatorio" });
    }

    const query = `
      SELECT 
        id, nombre_completo, correo, telefono, rol, activo, creado_en, ultimo_acceso
      FROM public.usuarios
      WHERE id = $1
    `;

    const result = await dbQuery(query, [usuarioId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (e) {
    console.error("❌ Error GET /usuarios/perfil:", e);
    res.status(500).json({ error: "Error consultando perfil" });
  }
});

// =======================================
// PUT Actualizar perfil
// =======================================
router.put("/perfil", async (req, res) => {
  try {
    const { usuarioId, nombreCompleto, telefono } = req.body;

    if (!usuarioId) {
      return res.status(400).json({ error: "usuarioId es obligatorio" });
    }

    const updateFields = [];
    const params = [];
    let paramCount = 1;

    if (nombreCompleto !== undefined) {
      updateFields.push(`nombre_completo = $${paramCount++}`);
      params.push(nombreCompleto);
    }

    if (telefono !== undefined) {
      updateFields.push(`telefono = $${paramCount++}`);
      params.push(telefono);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No hay campos para actualizar" });
    }

    updateFields.push(`actualizado_en = NOW()`);
    params.push(usuarioId);

    const query = `
      UPDATE public.usuarios
      SET ${updateFields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, nombre_completo, correo, telefono, rol, activo
    `;

    const result = await dbQuery(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (e) {
    console.error("❌ Error PUT /usuarios/perfil:", e);
    res.status(500).json({ error: "Error actualizando perfil" });
  }
});

export default router;

