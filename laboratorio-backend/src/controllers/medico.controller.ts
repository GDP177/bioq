// src/controllers/medico.controller.ts - VERSIÓN FINAL CON ESTRUCTURA CORRECTA

import { Request, Response } from 'express';
import { pool } from '../routes/db';
import bcrypt from 'bcrypt';

// LOGIN MÉDICO - Mantenemos el que ya funciona
export const loginMedico = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    console.log('🚀 LOGIN INTENTO:', { email, password: '***' });

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
        message: 'Correo no registrado' 
      });
    }

    const usuario = rows[0];
    const isValidPassword = await bcrypt.compare(password, usuario.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        message: 'Contraseña incorrecta' 
      });
    }

    const medicoData = {
      id: usuario.id_medico || usuario.id_usuario,
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre_medico || usuario.username,
      apellido: usuario.apellido_medico || '',
      email: usuario.email,
      rol: usuario.rol
    };

    return res.status(200).json({
      success: true,
      message: 'Login exitoso',
      medico: medicoData
    });

  } catch (error) {
    console.error('💥 ERROR EN LOGIN:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error del servidor'
    });
  }
};

// DASHBOARD MÉDICO - CON ESTRUCTURA CORRECTA Y JOIN FUNCIONAL
export const getDashboardMedico = async (req: Request, res: Response) => {
  const id_medico = parseInt(req.params.id_medico);

  try {
    console.log('📊 DASHBOARD - Consultando datos para médico ID:', id_medico);

    if (!id_medico || isNaN(id_medico)) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de médico inválido' 
      });
    }

    // 1. OBTENER DATOS DEL MÉDICO
    console.log('👨‍⚕️ Obteniendo datos del médico...');
    const [medicoRows]: any = await pool.query(
      `SELECT 
        m.id_medico,
        m.nombre_medico, 
        m.apellido_medico,
        m.email,
        m.especialidad,
        m.matricula_medica,
        m.telefono
       FROM medico m 
       WHERE m.id_medico = ? AND m.activo = 1`, 
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

    // 2. ESTADÍSTICAS DE ÓRDENES
    console.log('📋 Contando órdenes...');
    const [ordenesRows]: any = await pool.query(
      `SELECT 
        COUNT(*) as total_ordenes,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'en_proceso' THEN 1 ELSE 0 END) as en_proceso,
        SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END) as completadas,
        SUM(CASE WHEN urgente = 1 THEN 1 ELSE 0 END) as urgentes
       FROM orden 
       WHERE id_medico_solicitante = ?`,
      [id_medico]
    );

    const estadisticasOrdenes = ordenesRows[0] || {};
    console.log('📊 Estadísticas órdenes:', estadisticasOrdenes);

    // 3. ESTADÍSTICAS DE ANÁLISIS - USANDO LOS ESTADOS CORRECTOS
    console.log('🧪 Contando análisis...');
    const [analisisRows]: any = await pool.query(
      `SELECT 
        COUNT(*) as total_analisis,
        SUM(CASE WHEN oa.estado = 'pendiente' THEN 1 ELSE 0 END) as analisis_pendientes,
        SUM(CASE WHEN oa.estado = 'procesando' THEN 1 ELSE 0 END) as analisis_proceso,
        SUM(CASE WHEN oa.estado = 'finalizado' THEN 1 ELSE 0 END) as analisis_listos,
        SUM(CASE WHEN oa.estado = 'cancelado' THEN 1 ELSE 0 END) as analisis_cancelados
       FROM orden_analisis oa
       JOIN orden o ON oa.id_orden = o.id_orden
       WHERE o.id_medico_solicitante = ?`,
      [id_medico]
    );

    const estadisticasAnalisis = analisisRows[0] || {};
    console.log('🔬 Estadísticas análisis:', estadisticasAnalisis);

    // 4. ÓRDENES RECIENTES
    console.log('📅 Obteniendo órdenes recientes...');
    const [ordenesRecientesRows]: any = await pool.query(
      `SELECT 
        o.id_orden,
        o.nro_orden,
        o.fecha_ingreso_orden,
        o.fecha_procesamiento,
        o.fecha_finalizacion,
        o.estado,
        o.urgente,
        o.observaciones,
        p.nombre_paciente,
        p.apellido_paciente,
        p.dni,
        p.mutual,
        p.edad,
        COUNT(oa.id_orden_analisis) as total_analisis,
        SUM(CASE WHEN oa.estado = 'finalizado' THEN 1 ELSE 0 END) as analisis_listos
       FROM orden o
       JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
       LEFT JOIN orden_analisis oa ON o.id_orden = oa.id_orden
       WHERE o.id_medico_solicitante = ?
       GROUP BY o.id_orden, o.nro_orden, o.fecha_ingreso_orden, o.fecha_procesamiento, 
                o.fecha_finalizacion, o.estado, o.urgente, o.observaciones,
                p.nombre_paciente, p.apellido_paciente, p.dni, p.mutual, p.edad
       ORDER BY o.fecha_ingreso_orden DESC
       LIMIT 10`,
      [id_medico]
    );

    console.log('📝 Órdenes recientes encontradas:', ordenesRecientesRows.length);

    // 5. PACIENTES ÚNICOS
    console.log('👥 Obteniendo pacientes recientes...');
    const [pacientesRows]: any = await pool.query(
      `SELECT DISTINCT
        p.nro_ficha,
        p.nombre_paciente,
        p.apellido_paciente,
        p.dni,
        p.edad,
        p.sexo,
        p.mutual,
        p.telefono,
        MAX(o.fecha_ingreso_orden) as ultima_orden,
        COUNT(o.id_orden) as total_ordenes
       FROM paciente p
       JOIN orden o ON p.nro_ficha = o.nro_ficha_paciente
       WHERE o.id_medico_solicitante = ?
       GROUP BY p.nro_ficha, p.nombre_paciente, p.apellido_paciente, p.dni, 
                p.edad, p.sexo, p.mutual, p.telefono
       ORDER BY MAX(o.fecha_ingreso_orden) DESC
       LIMIT 8`,
      [id_medico]
    );

    console.log('👤 Pacientes únicos encontrados:', pacientesRows.length);

    // 6. ANÁLISIS MÁS SOLICITADOS - CON JOIN CORREGIDO
    console.log('📈 Obteniendo análisis más solicitados...');
    const [analisisFrecuentesRows]: any = await pool.query(
      `SELECT 
        a.codigo_practica as codigo,
        a.descripcion_practica as descripcion,
        a.TIPO as tipo,
        COUNT(*) as veces_solicitado,
        SUM(CASE WHEN oa.estado = 'finalizado' THEN 1 ELSE 0 END) as completados
       FROM orden_analisis oa
       JOIN orden o ON oa.id_orden = o.id_orden
       JOIN analisis a ON oa.codigo_practica = a.codigo_practica
       WHERE o.id_medico_solicitante = ?
       GROUP BY a.codigo_practica, a.descripcion_practica, a.TIPO
       ORDER BY COUNT(*) DESC
       LIMIT 5`,
      [id_medico]
    );

    console.log('🏆 Análisis más frecuentes:', analisisFrecuentesRows.length);

    // 7. GENERAR NOTIFICACIONES DINÁMICAS
    const notificaciones = [];
    
    if ((estadisticasOrdenes.urgentes || 0) > 0) {
      notificaciones.push(`⚠️ Tienes ${estadisticasOrdenes.urgentes} orden(es) marcada(s) como urgente`);
    }
    
    if ((estadisticasAnalisis.analisis_listos || 0) > 0) {
      notificaciones.push(`✅ ${estadisticasAnalisis.analisis_listos} análisis están listos para revisión`);
    }
    
    if ((estadisticasOrdenes.pendientes || 0) > 0) {
      notificaciones.push(`📋 ${estadisticasOrdenes.pendientes} órdenes pendientes de procesamiento`);
    }
    
    if ((estadisticasAnalisis.analisis_pendientes || 0) > 0) {
      notificaciones.push(`🔬 ${estadisticasAnalisis.analisis_pendientes} análisis pendientes de procesamiento`);
    }

    if (notificaciones.length === 0) {
      notificaciones.push('🎉 ¡Todo al día! No hay notificaciones pendientes');
    }

    // 8. PREPARAR RESPUESTA COMPLETA
    const dashboardData = {
      success: true,
      medico: {
        id: medico.id_medico,
        nombre: medico.nombre_medico,
        apellido: medico.apellido_medico,
        email: medico.email,
        especialidad: medico.especialidad,
        matricula: medico.matricula_medica,
        telefono: medico.telefono
      },
      estadisticas: {
        // Estadísticas de órdenes
        total_ordenes: estadisticasOrdenes.total_ordenes || 0,
        ordenes_pendientes: estadisticasOrdenes.pendientes || 0,
        ordenes_proceso: estadisticasOrdenes.en_proceso || 0,
        ordenes_completadas: estadisticasOrdenes.completadas || 0,
        ordenes_urgentes: estadisticasOrdenes.urgentes || 0,
        
        // Estadísticas de análisis
        total_analisis: estadisticasAnalisis.total_analisis || 0,
        analisis_pendientes: estadisticasAnalisis.analisis_pendientes || 0,
        analisis_proceso: estadisticasAnalisis.analisis_proceso || 0,
        analisis_listos: estadisticasAnalisis.analisis_listos || 0,
        analisis_entregados: 0, // No hay estado 'entregado' en tu BD
        
        // Contadores adicionales
        total_pacientes: pacientesRows.length,
        ordenes_recientes: ordenesRecientesRows.length
      },
      ordenes_recientes: ordenesRecientesRows.map((orden: any) => ({
        id: orden.id_orden,
        nro_orden: orden.nro_orden || `ORD-${orden.id_orden}`,
        fecha_ingreso: orden.fecha_ingreso_orden,
        fecha_procesamiento: orden.fecha_procesamiento,
        fecha_finalizacion: orden.fecha_finalizacion,
        estado: orden.estado,
        urgente: orden.urgente === 1,
        observaciones: orden.observaciones,
        paciente: {
          nombre: orden.nombre_paciente,
          apellido: orden.apellido_paciente,
          dni: orden.dni,
          mutual: orden.mutual,
          edad: orden.edad
        },
        progreso: {
          total_analisis: orden.total_analisis || 0,
          analisis_listos: orden.analisis_listos || 0,
          porcentaje: orden.total_analisis > 0 ? Math.round((orden.analisis_listos / orden.total_analisis) * 100) : 0
        }
      })),
      pacientes_recientes: pacientesRows.map((paciente: any) => ({
        nro_ficha: paciente.nro_ficha,
        nombre: paciente.nombre_paciente,
        apellido: paciente.apellido_paciente,
        dni: paciente.dni,
        edad: paciente.edad,
        sexo: paciente.sexo,
        mutual: paciente.mutual,
        telefono: paciente.telefono,
        ultima_orden: paciente.ultima_orden,
        total_ordenes: paciente.total_ordenes
      })),
      analisis_frecuentes: analisisFrecuentesRows.map((analisis: any) => ({
        codigo: analisis.codigo,
        descripcion: analisis.descripcion,
        tipo: analisis.tipo,
        veces_solicitado: analisis.veces_solicitado,
        porcentaje_completado: analisis.completados > 0 ? Math.round((analisis.completados / analisis.veces_solicitado) * 100) : 0
      })),
      notificaciones,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Dashboard preparado exitosamente para médico ID:', id_medico);
    console.log('📊 Resumen:', {
      medico_id: id_medico,
      medico_nombre: `${medico.nombre_medico} ${medico.apellido_medico}`,
      total_ordenes: dashboardData.estadisticas.total_ordenes,
      total_analisis: dashboardData.estadisticas.total_analisis,
      total_pacientes: dashboardData.estadisticas.total_pacientes,
      ordenes_urgentes: dashboardData.estadisticas.ordenes_urgentes,
      analisis_listos: dashboardData.estadisticas.analisis_listos
    });

    return res.status(200).json(dashboardData);

  } catch (error) {
    console.error("💥 ERROR EN DASHBOARD:", error);
    return res.status(500).json({ 
      success: false,
      message: "Error al obtener dashboard",
      error: process.env.NODE_ENV === 'development' ? error?.toString() : undefined
    });
  }
};