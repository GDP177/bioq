import { Request, Response } from 'express';
import { pool } from '../routes/db';
import bcrypt from 'bcrypt';

// Obtener usuarios
export const getUsuarios = async (req: Request, res: Response) => {
    try {
        const [rows]: any = await pool.query("SELECT id_usuario, username, email, rol, activo FROM usuarios ORDER BY id_usuario DESC");
        res.json({ success: true, usuarios: rows }); 
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener lista" });
    }
};

// Restablecer contraseña
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

// ==========================================
// CREAR USUARIO (CON TRANSACCIÓN PARA MÉDICO)
// ==========================================
export const createUsuario = async (req: Request, res: Response) => {
    const { username, email, rol, password } = req.body;
    
    // Usamos una conexión dedicada para manejar la transacción de forma segura
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction(); // Inicia la transacción

        console.log(`📝 Creando usuario: ${username} (${rol})`);

        // 1. Insertar el Usuario
        const hash = await bcrypt.hash(password || '123456', 10);
        const queryUser = `
            INSERT INTO usuarios (username, email, password_hash, rol, activo, fecha_creacion) 
            VALUES (?, ?, ?, ?, 1, NOW())
        `;
        const [resultUser]: any = await connection.query(queryUser, [username, email, hash, rol]);
        const newUserId = resultUser.insertId;

        // 2. Si es Médico, crear INMEDIATAMENTE la entrada en tabla medico
        // Esto evita problemas de IDs desincronizados luego.
        if (rol === 'medico') {
            console.log(`🔗 Vinculando perfil médico vacío para usuario ID: ${newUserId}`);
            const queryMedico = `
                INSERT INTO medico (id_usuario, email, activo, fecha_creacion) 
                VALUES (?, ?, 1, NOW())
            `;
            await connection.query(queryMedico, [newUserId, email]);
        }

        await connection.commit(); // Confirmar cambios en DB
        
        console.log("✅ Usuario creado exitosamente.");
        res.json({ 
            success: true, 
            message: "Usuario creado correctamente",
            id_usuario: newUserId 
        });

    } catch (error: any) {
        await connection.rollback(); // Si falla, deshacer todo
        console.error("❌ Error al crear usuario (Rollback):", error.message);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: "El usuario o el email ya están registrados." });
        }

        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release(); // Liberar conexión
    }
};

// Actualizar usuario
export const updateUsuario = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { username, email, rol, activo } = req.body;
    
    try {
        const idNumerico = parseInt(id);
        const estadoBinario = Number(activo) === 1 ? 1 : 0;

        await pool.query(
            "UPDATE usuarios SET username = ?, email = ?, rol = ?, activo = ? WHERE id_usuario = ?",
            [username, email, rol, estadoBinario, idNumerico]
        );

        res.json({ success: true, message: "Perfil actualizado correctamente" });
    } catch (error: any) {
        console.error("Error SQL:", error.message);
        res.status(500).json({ success: false, message: "Error de base de datos: " + error.message });
    }
};