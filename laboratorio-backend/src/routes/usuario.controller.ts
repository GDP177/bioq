// src/controllers/usuario.controller.ts

import { Request, Response } from 'express';
import { pool } from '../routes/db';
import bcrypt from 'bcrypt';

// ... (MANTENER TUS FUNCIONES EXISTENTES: getUsuarios, resetPassword, createUsuario, updateUsuario IGUAL QUE ANTES) ...

// ============================================
// ACTUALIZAR PERFIL (DATOS + PASSWORD)
// ============================================
export const updateUserProfile = async (req: Request, res: Response) => {
    const { 
        id_usuario, rol, nombre, apellido, dni, matricula, 
        telefono, direccion, email, 
        currentPassword, newPassword // Nuevos campos para password
    } = req.body;

    console.log("📝 Actualizando perfil para ID:", id_usuario, "Rol:", rol);

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // --- 1. VERIFICACIÓN Y CAMBIO DE CONTRASEÑA (OPCIONAL) ---
        if (currentPassword && newPassword) {
            // Buscar la contraseña actual en la BD
            const [userRows]: any = await connection.query(
                'SELECT password_hash FROM usuarios WHERE id_usuario = ?', 
                [id_usuario]
            );

            if (userRows.length === 0) {
                throw new Error("Usuario no encontrado.");
            }

            // Comparar contraseña ingresada con el hash guardado
            const validPassword = await bcrypt.compare(currentPassword, userRows[0].password_hash);
            
            if (!validPassword) {
                await connection.rollback();
                return res.status(401).json({ success: false, message: "La contraseña actual es incorrecta." });
            }

            // Encriptar nueva contraseña y actualizar
            const newHash = await bcrypt.hash(newPassword, 10);
            await connection.query(
                'UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?', 
                [newHash, id_usuario]
            );
            console.log("🔐 Contraseña actualizada correctamente.");
        }

        // --- 2. ACTUALIZACIÓN DE EMAIL EN TABLA BASE ---
        // Esto cambia el email de login
        await connection.query(
            'UPDATE usuarios SET email = ? WHERE id_usuario = ?', 
            [email, id_usuario]
        );

        // --- 3. ACTUALIZACIÓN DE DATOS EN TABLA DE ROL ---
        // Sincroniza datos personales + email en la tabla específica
        if (rol === 'medico') {
            await connection.query(
                `UPDATE medico SET 
                    nombre_medico = ?, 
                    apellido_medico = ?, 
                    dni_medico = ?, 
                    matricula_medica = ?, 
                    telefono = ?, 
                    direccion = ?, 
                    email = ?  -- Sincronizamos email aquí también
                 WHERE id_usuario = ?`,
                [nombre, apellido, dni, matricula, telefono, direccion, email, id_usuario]
            );
        } else if (rol === 'bioquimico') {
            // Nota: Ajusta los nombres de columnas si tu tabla 'bioquimico' tiene nombres distintos (ej: Nombre_bq vs nombre)
            // Aquí asumo nombres estándar o los mapeo. Si usas 'Nombre_bq', cámbialo aquí.
            await connection.query(
                `UPDATE bioquimico SET 
                    nombre_bioquimico = ?, 
                    apellido_bioquimico = ?, 
                    dni_bioquimico = ?, 
                    matricula_bioquimico = ?, 
                    telefono = ?, 
                    direccion = ?, 
                    email = ? 
                 WHERE id_usuario = ?`,
                [nombre, apellido, dni, matricula, telefono, direccion, email, id_usuario]
            );
        } else if (rol === 'admin') {
            // Para admin, a veces solo se actualiza la tabla usuarios, 
            // pero si tienes tabla 'admin_perfil', agrégalo aquí.
        }

        await connection.commit();
        
        // Devolvemos los datos actualizados para refrescar el frontend
        res.json({ 
            success: true, 
            message: 'Perfil actualizado correctamente.',
            usuario: {
                nombre, apellido, email, telefono, direccion, dni, matricula
            }
        });

    } catch (error: any) {
        await connection.rollback();
        console.error("💥 Error actualizando perfil:", error);
        res.status(500).json({ success: false, message: error.message || "Error al actualizar perfil." });
    } finally {
        connection.release();
    }
};

export default {
   
    updateUserProfile
};