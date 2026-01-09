import { Request, Response } from 'express';
import { pool } from '../routes/db';
import bcrypt from 'bcrypt';

// Obtener usuarios - Clave 'usuarios' para el frontend
export const getUsuarios = async (req: Request, res: Response) => {
    try {
        const [rows]: any = await pool.query("SELECT id_usuario, username, email, rol, activo FROM usuarios ORDER BY id_usuario DESC");
        res.json({ success: true, usuarios: rows }); 
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener lista" });
    }
};

// Restablecer contraseña a clave genérica
export const resetPassword = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const hash = await bcrypt.hash('123456', 10);
        await pool.query("UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?", [hash, id]);
        res.json({ success: true, message: "Contraseña restablecida a: 123456" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al resetear clave" });
    }
};

// Crear usuario manual
export const createUsuario = async (req: Request, res: Response) => {
    const { username, email, rol, password } = req.body;
    try {
        const hash = await bcrypt.hash(password || '123456', 10);
        
        // ✅ IMPORTANTE: No incluimos id_usuario en las columnas ni en los valores
        const query = `
            INSERT INTO usuarios (username, email, password_hash, rol, activo, fecha_creacion) 
            VALUES (?, ?, ?, ?, 1, NOW())
        `;
        
        await pool.query(query, [username, email, hash, rol]);
        
        res.json({ success: true, message: "Usuario creado correctamente" });
    } catch (error: any) {
        console.error("Error al crear usuario:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Actualizar usuario - Aquí estaba el Error 500
export const updateUsuario = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { username, email, rol, activo } = req.body;
    
    try {
        // ✅ Aseguramos que el ID y el estado sean números puros
        const idNumerico = parseInt(id);
        const estadoBinario = Number(activo) === 1 ? 1 : 0;

        // ✅ La consulta debe ser un UPDATE específico por ID
        const [result]: any = await pool.query(
            "UPDATE usuarios SET username = ?, email = ?, rol = ?, activo = ? WHERE id_usuario = ?",
            [username, email, rol, estadoBinario, idNumerico]
        );

        res.json({ success: true, message: "Perfil actualizado correctamente" });
    } catch (error: any) {
        // Si sale "Duplicate entry", la DB sigue creyendo que 'activo' es PK
        console.error("Error SQL:", error.message);
        res.status(500).json({ success: false, message: "Error de base de datos: " + error.message });
    }
};