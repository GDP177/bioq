// src/routes/authRoutes.ts
import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
};

// Registro
router.post("/register", async (req, res) => {
  const { email, password, username, rol } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ message: "Faltan datos" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const connection = await mysql.createConnection(dbConfig);

    const query = `
      INSERT INTO usuarios (
        email, password_hash, username, rol, activo, intentos_fallidos, ultimo_acceso, bloqueado_hasta
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await connection.execute(query, [
      email,
      hashedPassword,
      username,
      rol || "admin",
      1,
      0,
      null,
      null
    ]);
    await connection.end();

    res.json({ message: "Usuario registrado correctamente" });
  } catch (error: any) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "El email ya está registrado." });
    }
    res.status(500).json({ message: "Error al registrar usuario" });
  }
});

// Login general
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Faltan email o contraseña." });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT * FROM usuarios WHERE email = ? LIMIT 1",
      [email]
    );
    await connection.end();

    const userRows = rows as any[];

    if (userRows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const user = userRows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    res.status(200).json({
      message: "Login exitoso",
      usuario: {
        id: user.id,
        username: user.username,
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

export default router;
