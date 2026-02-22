// src/controllers/usuario.controller.ts

import { Request, Response } from 'express';
import { pool } from '../routes/db';
import bcrypt from 'bcrypt';

// ============================================
// OBTENER USUARIOS
// ============================================
export const getUsuarios = async (req: Request, res: Response) => {
    try {
        const [rows]: any = await pool.query("SELECT id_usuario, username, email, rol, activo FROM usuarios ORDER BY id_usuario DESC");
        res.json({ success: true, usuarios: rows }); 
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener lista" });
    }
};

// ============================================
// RESETEAR CONTRASEÑA (ADMIN)
// ============================================
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

// ============================================
// CREAR USUARIO (CON TRANSACCIÓN)
// ============================================
export const createUsuario = async (req: Request, res: Response) => {
    const { username, email, rol, password } = req.body;
    
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        console.log(`📝 Creando usuario: ${username} (${rol})`);

        // 1. Insertar el Usuario en tabla login
        const hash = await bcrypt.hash(password || '123456', 10);
        const [resultUser]: any = await connection.query(
            `INSERT INTO usuarios (username, email, password_hash, rol, activo, fecha_creacion) 
             VALUES (?, ?, ?, ?, 1, NOW())`,
            [username, email, hash, rol]
        );
        const newUserId = resultUser.insertId;

        // 2. Crear perfil asociado según el rol
        if (rol === 'medico') {
            await connection.query(
                `INSERT INTO medico (id_usuario, email, activo, fecha_creacion) VALUES (?, ?, 1, NOW())`, 
                [newUserId, email]
            );
        } else if (rol === 'bioquimico') {
            await connection.query(
                `INSERT INTO bioquimico (id_usuario, email, activo, fecha_creacion) VALUES (?, ?, 1, NOW())`, 
                [newUserId, email]
            );
        }

        await connection.commit();
        
        res.json({ 
            success: true, 
            message: "Usuario creado correctamente",
            id_usuario: newUserId 
        });

    } catch (error: any) {
        await connection.rollback();
        console.error("❌ Error al crear usuario:", error.message);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: "El usuario o el email ya están registrados." });
        }

        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

// ============================================
// ACTUALIZAR USUARIO (ADMIN)
// ============================================
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

// ============================================
// ✅ ACTUALIZAR PERFIL (AUTO-GESTIÓN: DATOS, EMAIL Y PASS)
// ============================================
export const updateUserProfile = async (req: Request, res: Response) => {
    const { 
        id_usuario, rol, nombre, apellido, dni, matricula, 
        telefono, direccion, email, 
        currentPassword, newPassword 
    } = req.body;

    console.log(`📝 UpdateProfile - Usuario: ${id_usuario}, Rol: ${rol}`);

    // --- 1. VALIDACIONES DE DATOS ---
    if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, message: "El email es obligatorio y debe ser válido." });
    }
    if (!nombre || nombre.trim() === "" || !apellido || apellido.trim() === "") {
        return res.status(400).json({ success: false, message: "El Nombre y Apellido son obligatorios." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // --- 2. GESTIÓN DE CONTRASEÑA (Solo si se enviaron datos) ---
        if (currentPassword && newPassword) {
            // Validar longitud
            if (newPassword.length < 6) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: "La nueva contraseña debe tener al menos 6 caracteres." });
            }

            // Obtener hash actual de la BD
            const [userRows]: any = await connection.query('SELECT password_hash FROM usuarios WHERE id_usuario = ?', [id_usuario]);
            
            if (userRows.length === 0) {
                await connection.rollback();
                return res.status(404).json({ success: false, message: "Usuario no encontrado." });
            }

            // Verificar que la contraseña actual sea correcta
            const validPassword = await bcrypt.compare(currentPassword, userRows[0].password_hash);
            if (!validPassword) {
                await connection.rollback();
                return res.status(401).json({ success: false, message: "La contraseña actual es incorrecta." });
            }

            // Encriptar y actualizar la nueva contraseña
            const newHash = await bcrypt.hash(newPassword, 10);
            await connection.query('UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?', [newHash, id_usuario]);
            console.log("🔐 Contraseña actualizada exitosamente.");
        }

        // --- 3. ACTUALIZAR EMAIL EN TABLA USUARIOS (LOGIN) ---
        await connection.query('UPDATE usuarios SET email = ? WHERE id_usuario = ?', [email, id_usuario]);

        // --- 4. ACTUALIZAR TABLAS ESPECÍFICAS DE ROLES ---
        if (rol === 'medico') {
            await connection.query(
                `UPDATE medico SET 
                    nombre_medico = ?, 
                    apellido_medico = ?, 
                    dni_medico = ?, 
                    matricula_medica = ?, 
                    telefono = ?, 
                    direccion = ?, 
                    email = ? 
                 WHERE id_usuario = ?`,
                [nombre, apellido, dni, matricula, telefono, direccion, email, id_usuario]
            );
        } 
        else if (rol === 'bioquimico') {
            // ✅ CORRECCIÓN FINAL: Columnas exactas de la tabla 'bioquimico'
            await connection.query(
                `UPDATE bioquimico SET 
                    nombre_bq = ?, 
                    apellido_bq = ?, 
                    dni_bioquimico = ?, 
                    matricula_profesional = ?, 
                    telefono = ?, 
                    direccion = ?, 
                    email = ? 
                 WHERE id_usuario = ?`,
                [nombre, apellido, dni, matricula, telefono, direccion, email, id_usuario]
            );
        }

        await connection.commit();
        
        // Responder con éxito y devolver datos actualizados
        res.json({ 
            success: true, 
            message: 'Perfil actualizado correctamente.',
            usuario: { nombre, apellido, email, telefono, direccion, dni, matricula }
        });

    } catch (error: any) {
        await connection.rollback();
        console.error("💥 Error UpdateProfile:", error);
        
        // Manejo de error de duplicados (Email ya existe en otro usuario)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: "El email ingresado ya está en uso por otro usuario." });
        }

        // Manejo de error de columnas
        if (error.code === 'ER_BAD_FIELD_ERROR') {
            return res.status(500).json({ success: false, message: `Error de BD: Columna desconocida (${error.sqlMessage}).` });
        }

        res.status(500).json({ success: false, message: "Error interno al actualizar perfil." });
    } finally {
        connection.release();
    }
};

export default {
    getUsuarios,
    resetPassword,
    createUsuario,
    updateUsuario,
    updateUserProfile
};