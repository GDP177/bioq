// laboratorio-backend/src/controllers/admin.controller.ts

import { Request, Response } from 'express';
import { pool } from '../routes/db';

// DASHBOARD ADMINISTRADOR
export const getDashboardAdmin = async (req: Request, res: Response) => {
  const id_usuario = parseInt(req.params.id_usuario);

  try {
    console.log('📊 DASHBOARD ADMIN - Generando reporte...');

    if (!id_usuario || isNaN(id_usuario)) {
      return res.status(400).json({ success: false, message: 'ID de usuario inválido' });
    }

    // 1. VERIFICAR ADMIN
    const [adminRows]: any = await pool.query(
      `SELECT u.id_usuario, u.username, u.email, u.rol FROM usuarios u WHERE u.id_usuario = ? AND u.rol = 'admin' AND u.activo = 1`, 
      [id_usuario]
    );

    if (adminRows.length === 0) return res.status(404).json({ success: false, message: 'Admin no encontrado' });
    const admin = adminRows[0];

    // 2. MÉTRICAS GENERALES
    const [metricasRows]: any = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM orden WHERE DATE(fecha_ingreso_orden) = CURDATE()) as ordenes_hoy,
        (SELECT COUNT(*) FROM orden WHERE DATE(fecha_ingreso_orden) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)) as ordenes_semana,
        (SELECT COUNT(*) FROM orden WHERE DATE(fecha_ingreso_orden) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as ordenes_mes,
        (SELECT COUNT(*) FROM paciente) as total_pacientes,
        (SELECT COUNT(*) FROM medico) as total_medicos,
        (SELECT COUNT(*) FROM bioquimico) as total_bioquimicos,
        (SELECT COUNT(*) FROM usuarios WHERE activo = 1) as total_usuarios`
    );
    const metricas = metricasRows[0] || {};

    // 3. ESTADÍSTICAS POR ESTADO
    const [estadosRows]: any = await pool.query(
      `SELECT estado, COUNT(*) as cantidad FROM orden WHERE DATE(fecha_ingreso_orden) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY estado`
    );
    const estadosPorCantidad = estadosRows.reduce((acc: any, row: any) => { acc[row.estado] = row.cantidad; return acc; }, {});

    // 4. ANÁLISIS FRECUENTES
    const [analisisFrecuentesRows]: any = await pool.query(
      `SELECT oa.codigo_practica, COUNT(*) as cantidad FROM orden_analisis oa JOIN orden o ON oa.id_orden = o.id_orden WHERE DATE(o.fecha_ingreso_orden) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY oa.codigo_practica ORDER BY COUNT(*) DESC LIMIT 10`
    );

    // 5. RENDIMIENTO MÉDICOS
    const [medicoRendimientoRows]: any = await pool.query(
      `SELECT m.nombre_medico, m.apellido_medico, m.especialidad, COUNT(o.id_orden) as ordenes_solicitadas FROM medico m LEFT JOIN orden o ON m.id_medico = o.id_medico_solicitante AND DATE(o.fecha_ingreso_orden) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY m.id_medico, m.nombre_medico, m.apellido_medico, m.especialidad ORDER BY COUNT(o.id_orden) DESC LIMIT 10`
    );

    // 🔥 6. ÓRDENES RECIENTES (CORREGIDO Y OPTIMIZADO)
    // Ahora usa GROUP BY para calcular el estado real en vivo y trae hasta 100 registros
    const [ordenesRecientesRows]: any = await pool.query(
      `SELECT 
          o.id_orden, o.nro_orden, o.fecha_ingreso_orden, o.urgente,
          p.Nombre_paciente as nombre_paciente, p.Apellido_paciente as apellido_paciente, p.DNI as dni,
          m.nombre_medico, m.apellido_medico,
          
          -- Lógica para detectar si está finalizada aunque la tabla diga 'pendiente'
          CASE 
              WHEN COUNT(oa.id_orden_analisis) > 0 
                   AND COUNT(oa.id_orden_analisis) = SUM(CASE WHEN oa.estado = 'finalizado' THEN 1 ELSE 0 END) 
              THEN 'finalizado' 
              ELSE o.estado 
          END as estado_real

       FROM orden o
       JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
       LEFT JOIN medico m ON o.id_medico_solicitante = m.id_medico
       LEFT JOIN orden_analisis oa ON o.id_orden = oa.id_orden
       
       GROUP BY o.id_orden, o.nro_orden, o.fecha_ingreso_orden, o.urgente, o.estado,
                p.Nombre_paciente, p.Apellido_paciente, p.DNI,
                m.nombre_medico, m.apellido_medico
       
       ORDER BY o.fecha_ingreso_orden DESC
       LIMIT 100` // <--- LÍMITE AUMENTADO A 100
    );

    // 7. FACTURACIÓN
    const [facturacionRows]: any = await pool.query(
      `SELECT COUNT(o.id_orden) as total_ordenes_facturables, COUNT(CASE WHEN o.estado = 'finalizado' THEN 1 END) as ordenes_finalizadas FROM orden o WHERE DATE(o.fecha_ingreso_orden) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`
    );
    const facturacion = facturacionRows[0] || {};

    // 8. NOTIFICACIONES
    const notificaciones = [];
    if (parseInt(metricas.ordenes_hoy) > 50) notificaciones.push(`📈 Alto volumen: ${metricas.ordenes_hoy} órdenes hoy`);
    const ordenesPendientes = estadosPorCantidad.pendiente || 0;
    if (ordenesPendientes > 20) notificaciones.push(`⚠️ ${ordenesPendientes} órdenes pendientes`);
    if (notificaciones.length === 0) notificaciones.push('✅ Sistema funcionando normalmente');

    return res.status(200).json({
      success: true,
      administrador: { id: admin.id_usuario, username: admin.username, email: admin.email, rol: admin.rol },
      metricas_generales: metricas,
      estadisticas_ordenes: { pendientes: ordenesPendientes, en_proceso: estadosPorCantidad.en_proceso || 0, finalizadas: estadosPorCantidad.finalizado || 0, canceladas: estadosPorCantidad.cancelado || 0 },
      analisis_frecuentes: analisisFrecuentesRows.map((a: any) => ({ codigo: a.codigo_practica, cantidad: a.cantidad })),
      rendimiento_medicos: medicoRendimientoRows,
      
      // Mapeamos usando el 'estado_real' calculado
      ordenes_recientes: ordenesRecientesRows.map((o: any) => ({
        id: o.id_orden, nro_orden: o.nro_orden || `ORD-${o.id_orden}`, fecha_ingreso: o.fecha_ingreso_orden,
        estado: o.estado_real, // <--- USAMOS EL ESTADO CALCULADO
        urgente: o.urgente === 1,
        paciente: { nombre: o.nombre_paciente, apellido: o.apellido_paciente, dni: o.dni },
        medico: { nombre: o.nombre_medico, apellido: o.apellido_medico }
      })),
      
      facturacion: {
        ordenes_facturables: parseInt(facturacion.total_ordenes_facturables) || 0,
        ordenes_finalizadas: parseInt(facturacion.ordenes_finalizadas) || 0,
        porcentaje_finalizacion: facturacion.total_ordenes_facturables > 0 ? Math.round((facturacion.ordenes_finalizadas / facturacion.total_ordenes_facturables) * 100) : 0
      },
      notificaciones,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("💥 ERROR EN DASHBOARD ADMIN:", error);
    return res.status(500).json({ success: false, message: "Error al obtener dashboard", error: error.message });
  }
};

// ... (El resto de tus funciones como getAllPacientesAdmin y getAllUsuariosAdmin déjalas igual o pégalas si las borraste)
export const getAllPacientesAdmin = async (req: Request, res: Response) => {
  const buscar = req.query.buscar as string || '';
  const mutual = req.query.mutual as string || 'todos';
  const sexo = req.query.sexo as string || 'todos';
  const pagina = parseInt(req.query.pagina as string) || 1;
  const limite = parseInt(req.query.limite as string) || 50;

  try {
    let whereConditions = ['1=1'];
    let queryParams: any[] = [];

    if (buscar) {
      const searchTerm = `%${buscar}%`;
      whereConditions.push(`(p.Nombre_paciente LIKE ? OR p.Apellido_paciente LIKE ? OR p.DNI LIKE ?)`);
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (mutual !== 'todos') { whereConditions.push('p.mutual = ?'); queryParams.push(mutual); }
    if (sexo !== 'todos') { whereConditions.push('p.sexo = ?'); queryParams.push(sexo); }

    const whereClause = whereConditions.join(' AND ');
    const offset = (pagina - 1) * limite;

    const mainQuery = `
      SELECT p.nro_ficha, p.Nombre_paciente, p.Apellido_paciente, p.DNI, p.fecha_nacimiento, p.edad, p.sexo, 
             p.telefono, p.direccion, p.mutual, p.nro_afiliado, p.grupo_sanguineo,
             COALESCE(COUNT(o.id_orden), 0) as total_ordenes, MAX(o.fecha_ingreso_orden) as ultima_orden
      FROM paciente p
      LEFT JOIN orden o ON p.nro_ficha = o.nro_ficha_paciente
      WHERE ${whereClause}
      GROUP BY p.nro_ficha
      ORDER BY p.nro_ficha DESC
      LIMIT ? OFFSET ?`;

    queryParams.push(limite, offset);
    const [pacientesRows]: any = await pool.query(mainQuery, queryParams);

    const pacientes = pacientesRows.map((p: any) => ({
      nro_ficha: p.nro_ficha,
      nombre: p.Nombre_paciente,
      apellido: p.Apellido_paciente,
      dni: p.DNI,
      fecha_nacimiento: p.fecha_nacimiento,
      edad: p.edad,
      sexo: p.sexo,
      telefono: p.telefono,
      direccion: p.direccion,
      mutual: p.mutual,
      nro_afiliado: p.nro_afiliado,
      grupo_sanguineo: p.grupo_sanguineo,
      total_ordenes: p.total_ordenes,
      ultima_orden: p.ultima_orden
    }));

    const countQuery = `SELECT COUNT(DISTINCT p.nro_ficha) as total FROM paciente p WHERE ${whereClause}`;
    const [countRows]: any = await pool.query(countQuery, queryParams.slice(0, -2));
    
    return res.status(200).json({
      success: true,
      pacientes,
      total: countRows[0]?.total || 0,
      pagina_actual: pagina,
      total_paginas: Math.ceil((countRows[0]?.total || 0) / limite)
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Error al obtener pacientes" });
  }
};

export const getAllUsuariosAdmin = async (req: Request, res: Response) => {
  try {
    const [usuariosRows]: any = await pool.query(
      `SELECT u.id_usuario, u.username, u.email, u.rol, u.activo, u.fecha_creacion, u.ultimo_acceso,
              CASE 
                WHEN u.rol = 'medico' THEN CONCAT(m.nombre_medico, ' ', m.apellido_medico)
                WHEN u.rol = 'bioquimico' THEN CONCAT(b.nombre_bq, ' ', b.apellido_bq)
                ELSE u.username
              END as nombre_completo
       FROM usuarios u
       LEFT JOIN medico m ON u.id_usuario = m.id_usuario AND u.rol = 'medico'
       LEFT JOIN bioquimico b ON u.id_usuario = b.id_usuario AND u.rol = 'bioquimico'
       ORDER BY u.fecha_creacion DESC`
    );
    return res.status(200).json({ success: true, usuarios: usuariosRows, total: usuariosRows.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Error al obtener usuarios" });
  }
};