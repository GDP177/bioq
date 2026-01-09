// src/controllers/medico.controller.ts - CORREGIDO PARA TU ESTRUCTURA DE BD

import { Request, Response } from 'express';
import { pool } from '../routes/db';
import bcrypt from 'bcrypt';





// ============================================
// Crear solicitudad medica
// ============================================
export const crearSolicitudMedica = async (req: Request, res: Response) => {
    const { id_medico } = req.params;
    const { nro_ficha_paciente, analisis_solicitados, urgente, requiere_ayuno, observaciones, instrucciones_paciente } = req.body;
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Insertar en tabla 'ordenes'
        const nro_orden = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const [result]: any = await connection.query(
            `INSERT INTO ordenes (nro_orden, urgente, id_medico_solicitante, fecha_ingreso_orden, nro_ficha_paciente, estado, observaciones, requiere_ayuno, instrucciones_paciente) 
             VALUES (?, ?, ?, NOW(), ?, 'pendiente', ?, ?, ?)`,
            [nro_orden, urgente ? 1 : 0, id_medico, nro_ficha_paciente, observaciones, requiere_ayuno ? 1 : 0, instrucciones_paciente]
        );

        const id_orden = result.insertId;

        // 2. Insertar cada análisis en 'orden_analisis'
        for (const codigo_practica of analisis_solicitados) {
            await connection.query(
                `INSERT INTO orden_analisis (id_orden, codigo_practica, estado, fecha_creacion) 
                 VALUES (?, ?, 'pendiente', NOW())`,
                [id_orden, codigo_practica]
            );
        }

        await connection.commit();
        res.json({ success: true, orden_id: id_orden, nro_orden });
    } catch (error: any) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};
// ============================================
// LOGIN MÉDICO - RESPETANDO TU ESTRUCTURA REAL
// ============================================
export const loginMedico = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    console.log('🚀 LOGIN MÉDICO - Email:', email);

    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Query usando TUS nombres reales de columnas
    const query = `
      SELECT 
        u.id_usuario,
        u.email,
        u.password_hash,
        u.rol,
        u.username,
        m.id_medico,
        m.nombre_medico,
        m.apellido_medico,
        m.especialidad,
        m.matricula_medica,
        m.telefono,
        m.email as medico_email
      FROM usuarios u
      LEFT JOIN medico m ON u.id_usuario = m.id_usuario
      WHERE u.email = ? AND u.activo = 1
      LIMIT 1
    `;

    const [rows]: any = await pool.query(query, [email]);
    
    if (rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Correo no registrado o usuario inactivo' 
      });
    }

    const usuario = rows[0];
    
    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, usuario.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        message: 'Contraseña incorrecta' 
      });
    }

    // VERIFICAR SI TIENE PERFIL COMPLETO
    if (!usuario.id_medico) {
      // NO tiene perfil completo - primera vez
      return res.status(200).json({
        success: true,
        message: 'Login exitoso - Perfil incompleto',
        requiere_completar_perfil: true,
        usuario: {
          id_usuario: usuario.id_usuario,
          email: usuario.email,
          username: usuario.username,
          rol: usuario.rol
        }
      });
    } else {
      // SÍ tiene perfil completo - acceso normal
      const usuarioData = {
        id: usuario.id_medico,
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre_medico,
        apellido: usuario.apellido_medico,
        email: usuario.email,
        rol: usuario.rol,
        especialidad: usuario.especialidad,
        matricula: usuario.matricula_medica,
        telefono: usuario.telefono
      };

      return res.status(200).json({
        success: true,
        message: 'Login exitoso',
        requiere_completar_perfil: false,
        medico: usuarioData  // Mantener 'medico' para compatibilidad
      });
    }

  } catch (error: any) {
    console.error('💥 ERROR EN LOGIN MÉDICO:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error del servidor'
    });
  }
};

// ============================================
// DASHBOARD MÉDICO - CORREGIDO PARA TU BD
// ============================================
export const getDashboardMedico = async (req: Request, res: Response) => {
  const id_medico = parseInt(req.params.id_medico);

  try {
    console.log('📊 DASHBOARD MÉDICO - ID:', id_medico);

    if (!id_medico || isNaN(id_medico)) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de médico inválido' 
      });
    }

    // 1. OBTENER DATOS DEL MÉDICO - USANDO TUS COLUMNAS REALES
    const [medicoRows]: any = await pool.query(
      `SELECT 
        m.id_medico,
        m.nombre_medico, 
        m.apellido_medico,
        m.email,
        m.especialidad,
        m.matricula_medica,
        m.telefono,
        m.activo
       FROM medico m 
       WHERE m.id_medico = ? AND (m.activo IS NULL OR m.activo = 1)`, 
      [id_medico]
    );

    if (medicoRows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Médico no encontrado' 
      });
    }

    const medico = medicoRows[0];
    console.log('✅ Médico encontrado:', medico.nombre_medico, medico.apellido_medico);

    // 2. ESTADÍSTICAS DE ÓRDENES - USANDO TU ESTRUCTURA
    const [ordenesRows]: any = await pool.query(
      `SELECT 
        COUNT(*) as total_ordenes,
        SUM(CASE WHEN urgente = 1 THEN 1 ELSE 0 END) as urgentes
       FROM orden 
       WHERE id_medico_solicitante = ?`,
      [id_medico]
    );

    const estadisticasOrdenes = ordenesRows[0] || { total_ordenes: 0, urgentes: 0 };

    // 3. ÓRDENES RECIENTES - USANDO TUS NOMBRES DE COLUMNAS
    const [ordenesRecientesRows]: any = await pool.query(
      `SELECT 
        o.id_orden,
        o.fecha_ingreso_orden,
        o.urgente,
        p.Nombre_paciente,
        p.Apellido_paciente,
        p.DNI,
        p.mutual,
        p.edad
       FROM orden o
       JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
       WHERE o.id_medico_solicitante = ?
       ORDER BY o.fecha_ingreso_orden DESC
       LIMIT 10`,
      [id_medico]
    );

    // 4. PACIENTES ÚNICOS - USANDO TUS NOMBRES DE COLUMNAS
    const [pacientesRows]: any = await pool.query(
      `SELECT DISTINCT
        p.nro_ficha,
        p.Nombre_paciente,
        p.Apellido_paciente,
        p.DNI,
        p.edad,
        p.sexo,
        p.mutual,
        p.telefono,
        MAX(o.fecha_ingreso_orden) as ultima_orden,
        COUNT(o.id_orden) as total_ordenes
       FROM paciente p
       JOIN orden o ON p.nro_ficha = o.nro_ficha_paciente
       WHERE o.id_medico_solicitante = ?
       GROUP BY p.nro_ficha, p.Nombre_paciente, p.Apellido_paciente, 
                p.DNI, p.edad, p.sexo, p.mutual, p.telefono
       ORDER BY MAX(o.fecha_ingreso_orden) DESC
       LIMIT 8`,
      [id_medico]
    );

    // 5. GENERAR NOTIFICACIONES
    const notificaciones = [];
    
    if ((estadisticasOrdenes.urgentes || 0) > 0) {
      notificaciones.push(`⚠️ Tienes ${estadisticasOrdenes.urgentes} orden(es) urgente(s)`);
    }
    
    if (notificaciones.length === 0) {
      notificaciones.push('🎉 ¡Todo al día! No hay notificaciones pendientes');
    }

    // 6. CONSTRUIR RESPUESTA
    const dashboardData = {
      success: true,
      medico: {
        id: medico.id_medico,
        nombre: medico.nombre_medico,
        apellido: medico.apellido_medico,
        email: medico.email,
        especialidad: medico.especialidad || 'Medicina General',
        matricula: medico.matricula_medica,
        telefono: medico.telefono,
        rol: 'medico'
      },
      estadisticas: {
        total_ordenes: parseInt(estadisticasOrdenes.total_ordenes) || 0,
        ordenes_urgentes: parseInt(estadisticasOrdenes.urgentes) || 0,
        total_pacientes: pacientesRows.length,
        ordenes_recientes: ordenesRecientesRows.length
      },
      ordenes_recientes: ordenesRecientesRows.map((orden: any) => ({
        id: orden.id_orden,
        nro_orden: `ORD-${orden.id_orden}`,
        fecha_ingreso: orden.fecha_ingreso_orden,
        urgente: orden.urgente === 1,
        paciente: {
          nombre: orden.Nombre_paciente,
          apellido: orden.Apellido_paciente,
          dni: parseInt(orden.DNI) || 0,
          mutual: orden.mutual,
          edad: orden.edad
        }
      })),
      pacientes_recientes: pacientesRows.map((paciente: any) => ({
        nro_ficha: paciente.nro_ficha,
        nombre: paciente.Nombre_paciente,
        apellido: paciente.Apellido_paciente,
        dni: parseInt(paciente.DNI) || 0,
        edad: paciente.edad,
        sexo: paciente.sexo,
        mutual: paciente.mutual,
        telefono: paciente.telefono,
        ultima_orden: paciente.ultima_orden,
        total_ordenes: parseInt(paciente.total_ordenes)
      })),
      analisis_frecuentes: [], // Vacío por ahora para evitar errores
      notificaciones,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Dashboard generado exitosamente');
    return res.status(200).json(dashboardData);

  } catch (error: any) {
    console.error("💥 ERROR EN DASHBOARD:", error);
    return res.status(500).json({ 
      success: false,
      message: "Error al obtener dashboard",
      error: process.env.NODE_ENV === 'development' ? error?.toString() : undefined
    });
  }
};

// ============================================
// COMPLETAR PERFIL MÉDICO - USANDO TU ESTRUCTURA
// ============================================
export const completarPerfilMedico = async (req: Request, res: Response) => {
  const { 
    id_usuario,
    nombre_medico,
    apellido_medico,
    dni_medico,
    matricula_medica,
    especialidad,
    telefono,
    direccion 
  } = req.body;

  try {
    console.log('📝 COMPLETANDO PERFIL MÉDICO para usuario ID:', id_usuario);

    // Validaciones básicas
    if (!id_usuario || !nombre_medico || !apellido_medico || !dni_medico) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos obligatorios: nombre, apellido y DNI son requeridos'
      });
    }

    // Verificar que el usuario existe y es médico
    const [userRows]: any = await pool.query(
      'SELECT id_usuario, rol FROM usuarios WHERE id_usuario = ? AND rol = "medico" AND activo = 1',
      [id_usuario]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado o no es médico'
      });
    }

    // Verificar que no existe ya un perfil
    const [existingRows]: any = await pool.query(
      'SELECT id_medico FROM medico WHERE id_usuario = ?',
      [id_usuario]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'El perfil médico ya existe para este usuario'
      });
    }

    // Verificar que DNI no esté duplicado
    if (dni_medico) {
      const [duplicateRows]: any = await pool.query(
        'SELECT id_medico FROM medico WHERE dni_medico = ?',
        [dni_medico]
      );

      if (duplicateRows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'DNI ya registrado para otro médico'
        });
      }
    }

    // Insertar perfil médico - USANDO TUS COLUMNAS REALES
    const [result]: any = await pool.query(
      `INSERT INTO medico (
        id_usuario,
        nombre_medico,
        apellido_medico,
        dni_medico,
        matricula_medica,
        especialidad,
        telefono,
        direccion,
        email,
        activo,
        fecha_creacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 
        (SELECT email FROM usuarios WHERE id_usuario = ?), 
        1, NOW())`,
      [
        id_usuario,
        nombre_medico,
        apellido_medico,
        dni_medico,
        matricula_medica || null,
        especialidad || null,
        telefono || null,
        direccion || null,
        id_usuario
      ]
    );

    const id_medico = result.insertId;
    console.log('✅ Perfil médico creado con ID:', id_medico);

    // Obtener perfil completo para la respuesta
    const [newMedicoRows]: any = await pool.query(
      `SELECT 
        m.id_medico,
        m.nombre_medico,
        m.apellido_medico,
        m.dni_medico,
        m.matricula_medica,
        m.especialidad,
        m.telefono,
        m.direccion,
        m.email,
        u.username,
        u.rol
       FROM medico m
       JOIN usuarios u ON m.id_usuario = u.id_usuario
       WHERE m.id_medico = ?`,
      [id_medico]
    );

    const medico = newMedicoRows[0];

    return res.status(201).json({
      success: true,
      message: 'Perfil médico completado exitosamente',
      usuario: {
        id: medico.id_medico,
        id_usuario: id_usuario,
        nombre: medico.nombre_medico,
        apellido: medico.apellido_medico,
        email: medico.email,
        dni: medico.dni_medico,
        matricula: medico.matricula_medica,
        especialidad: medico.especialidad,
        telefono: medico.telefono,
        direccion: medico.direccion,
        rol: medico.rol
      }
    });

  } catch (error: any) {
    console.error('💥 ERROR AL COMPLETAR PERFIL MÉDICO:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'DNI o matrícula ya registrados'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};