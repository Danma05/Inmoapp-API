// routers/auth.js - Autenticación y registro
import express from "express";
import { dbQuery } from "../dbQuery.js";

const router = express.Router();

// =======================================
// LOGIN DE USUARIO
// =======================================
router.post("/login", async (req, res) => {
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

// =======================================
// REGISTRO DE USUARIO
// =======================================
router.post("/usuarios", async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      correo,
      telefono,
      password,
      aceptaTerminos,
      rol
    } = req.body;

    // Validaciones
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

    // ⚠ En producción deberías encriptar esta contraseña
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
      true
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

export default router;

