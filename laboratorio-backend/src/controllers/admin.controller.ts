// laboratorio-backend/src/controllers/admin.controller.ts

import { Request, Response } from 'express';
import { pool } from '../routes/db';

// DASHBOARD ADMINISTRADOR
export const getDashboardAdmin = async (req: Request, res: Response) => {
  const id_usuario = parseInt(req.params.id_usuario);

  try {
    console.log('📊 DASHBOARD ADMIN - Usuario ID:', id_usuario);

    if (!id_usuario || isNaN(id_usuario)) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de usuario inválido' 
      });
    }

    // 1. VERIFICAR QUE ES ADMINISTRADOR
    const [adminRows]: any = await pool.query(
      `SELECT 
        u.id_usuario,
        u.username,
        u.email,
        u.rol
       FROM usuarios u 
       WHERE u.id_usuario = ? AND u.rol = 'admin' AND u.activo = 1`, 
      [id_usuario]
    );

    if (adminRows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Administrador no encontrado' 
      });
    }

    const admin = adminRows[0];

    // 2. MÉTRICAS GENERALES
    const [metricasRows]: any = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM orden WHERE DATE(fecha_ingreso_orden) = CURDATE()) as ordenes_hoy,
        (SELECT COUNT(*) FROM orden WHERE DATE(fecha_ingreso_orden) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)) as ordenes_semana,
        (SELECT COUNT(*) FROM orden WHERE DATE(fecha_ingreso_orden) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as ordenes_mes,
        (SELECT COUNT(*) FROM paciente WHERE activo = 1) as total_pacientes,
        (SELECT COUNT(*) FROM medico WHERE activo = 1) as total_medicos,
        (SELECT COUNT(*) FROM bioquimico WHERE activo = 1) as total_bioquimicos,
        (SELECT COUNT(*) FROM usuarios WHERE activo = 1) as total_usuarios`
    );

    const metricas = metricasRows[0] || {};

    // 3. ESTADÍSTICAS DE ÓRDENES POR ESTADO
    const [estadosRows]: any = await pool.query(
      `SELECT 
        estado,
        COUNT(*) as cantidad
       FROM orden 
       WHERE DATE(fecha_ingreso_orden) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY estado`
    );

    const estadosPorCantidad = estadosRows.reduce((acc: any, row: any) => {
      acc[row.estado] = row.cantidad;
      return acc;
    }, {});

    // 4. ANÁLISIS MÁS SOLICITADOS
    const [analisisFrecuentesRows]: any = await pool.query(
      `SELECT 
        oa.codigo_practica,
        COUNT(*) as cantidad
       FROM orden_analisis oa
       JOIN orden o ON oa.id_orden = o.id_orden
       WHERE DATE(o.fecha_ingreso_orden) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY oa.codigo_practica
       ORDER BY COUNT(*) DESC
       LIMIT 10`
    );

    // 5. RENDIMIENTO POR MÉDICO (TOP 10)
    const [medicoRendimientoRows]: any = await pool.query(
      `SELECT 
        m.nombre_medico,
        m.apellido_medico,
        m.especialidad,
        COUNT(o.id_orden) as ordenes_solicitadas
       FROM medico m
       LEFT JOIN orden o ON m.id_medico = o.id_medico_solicitante 
         AND DATE(o.fecha_ingreso_orden) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       WHERE m.activo = 1
       GROUP BY m.id_medico, m.nombre_medico, m.apellido_medico, m.especialidad
       ORDER BY COUNT(o.id_orden) DESC
       LIMIT 10`
    );

    // 6. ÓRDENES RECIENTES
    const [ordenesRecientesRows]: any = await pool.query(
      `SELECT 
        o.id_orden,
        o.nro_orden,
        o.fecha_ingreso_orden,
        o.estado,
        o.urgente,
        p.Nombre_paciente as nombre_paciente,
        p.Apellido_paciente as apellido_paciente,
        p.DNI as dni,
        m.nombre_medico,
        m.apellido_medico
       FROM orden o
       JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
       LEFT JOIN medico m ON o.id_medico_solicitante = m.id_medico
       ORDER BY o.fecha_ingreso_orden DESC
       LIMIT 15`
    );

    // 7. FACTURACIÓN ESTIMADA (si tienes precios)
    const [facturacionRows]: any = await pool.query(
      `SELECT 
        COUNT(o.id_orden) as total_ordenes_facturables,
        COUNT(CASE WHEN o.estado = 'finalizado' THEN 1 END) as ordenes_finalizadas
       FROM orden o
       WHERE DATE(o.fecha_ingreso_orden) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`
    );

    const facturacion = facturacionRows[0] || {};

    // 8. NOTIFICACIONES PARA ADMIN
    const notificaciones = [];
    
    if (parseInt(metricas.ordenes_hoy) > 50) {
      notificaciones.push(`📈 Alto volumen: ${metricas.ordenes_hoy} órdenes procesadas hoy`);
    }
    
    const ordenesPendientes = estadosPorCantidad.pendiente || 0;
    if (ordenesPendientes > 20) {
      notificaciones.push(`⚠️ ${ordenesPendientes} órdenes pendientes requieren atención`);
    }

    if (notificaciones.length === 0) {
      notificaciones.push('✅ Sistema funcionando normalmente');
    }

    // 9. CONSTRUIR RESPUESTA
    const dashboardData = {
      success: true,
      administrador: {
        id: admin.id_usuario,
        username: admin.username,
        email: admin.email,
        rol: admin.rol
      },
      metricas_generales: {
        ordenes_hoy: parseInt(metricas.ordenes_hoy) || 0,
        ordenes_semana: parseInt(metricas.ordenes_semana) || 0,
        ordenes_mes: parseInt(metricas.ordenes_mes) || 0,
        total_pacientes: parseInt(metricas.total_pacientes) || 0,
        total_medicos: parseInt(metricas.total_medicos) || 0,
        total_bioquimicos: parseInt(metricas.total_bioquimicos) || 0,
        total_usuarios: parseInt(metricas.total_usuarios) || 0
      },
      estadisticas_ordenes: {
        pendientes: estadosPorCantidad.pendiente || 0,
        en_proceso: estadosPorCantidad.en_proceso || 0,
        finalizadas: estadosPorCantidad.finalizado || 0,
        canceladas: estadosPorCantidad.cancelado || 0
      },
      analisis_frecuentes: analisisFrecuentesRows.map((analisis: any) => ({
        codigo: analisis.codigo_practica,
        cantidad: analisis.cantidad
      })),
      rendimiento_medicos: medicoRendimientoRows.map((medico: any) => ({
        nombre: medico.nombre_medico,
        apellido: medico.apellido_medico,
        especialidad: medico.especialidad,
        ordenes_solicitadas: medico.ordenes_solicitadas
      })),
      ordenes_recientes: ordenesRecientesRows.map((orden: any) => ({
        id: orden.id_orden,
        nro_orden: orden.nro_orden || `ORD-${orden.id_orden}`,
        fecha_ingreso: orden.fecha_ingreso_orden,
        estado: orden.estado,
        urgente: orden.urgente === 1,
        paciente: {
          nombre: orden.nombre_paciente,
          apellido: orden.apellido_paciente,
          dni: orden.dni
        },
        medico: {
          nombre: orden.nombre_medico,
          apellido: orden.apellido_medico
        }
      })),
      facturacion: {
        ordenes_facturables: parseInt(facturacion.total_ordenes_facturables) || 0,
        ordenes_finalizadas: parseInt(facturacion.ordenes_finalizadas) || 0,
        porcentaje_finalizacion: facturacion.total_ordenes_facturables > 0 ? 
          Math.round((facturacion.ordenes_finalizadas / facturacion.total_ordenes_facturables) * 100) : 0
      },
      notificaciones,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Dashboard admin preparado exitosamente');

    return res.status(200).json(dashboardData);

  } catch (error) {
    console.error("💥 ERROR EN DASHBOARD ADMIN:", error);
    return res.status(500).json({ 
      success: false,
      message: "Error al obtener dashboard administrativo",
      error: process.env.NODE_ENV === 'development' ? error?.toString() : undefined
    });
  }
};

// GESTIÓN DE TODOS LOS PACIENTES (ADMIN)
export const getAllPacientesAdmin = async (req: Request, res: Response) => {
  const buscar = req.query.buscar as string || '';
  const mutual = req.query.mutual as string || 'todos';
  const sexo = req.query.sexo as string || 'todos';
  const orden = req.query.orden as string || 'reciente';
  const pagina = parseInt(req.query.pagina as string) || 1;
  const limite = parseInt(req.query.limite as string) || 50;

  try {
    console.log('👥 Admin obteniendo todos los pacientes');

    let whereConditions = ['p.estado IS NULL OR p.estado = "activo"'];
    let queryParams: any[] = [];

    // Filtros
    if (buscar) {
      const searchTerm = `%${buscar}%`;
      whereConditions.push(`(
        p.Nombre_paciente LIKE ? OR 
        p.Apellido_paciente LIKE ? OR 
        p.DNI LIKE ?
      )`);
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (mutual !== 'todos') {
      whereConditions.push('p.mutual = ?');
      queryParams.push(mutual);
    }

    if (sexo !== 'todos') {
      whereConditions.push('p.sexo = ?');
      queryParams.push(sexo);
    }

    const whereClause = whereConditions.join(' AND ');

    // Determinar ORDER BY
    let orderBy = 'p.fecha_alta DESC';
    switch (orden) {
      case 'nombre':
        orderBy = 'p.Apellido_paciente ASC, p.Nombre_paciente ASC';
        break;
      case 'dni':
        orderBy = 'p.DNI ASC';
        break;
      case 'edad_desc':
        orderBy = 'p.edad DESC';
        break;
      case 'mas_ordenes':
        orderBy = 'total_ordenes DESC';
        break;
    }

    const offset = (pagina - 1) * limite;

    // Query principal
    const mainQuery = `
      SELECT 
        p.nro_ficha,
        p.Nombre_paciente,
        p.Apellido_paciente,
        p.DNI,
        p.fecha_nacimiento,
        p.edad,
        p.sexo,
        p.telefono,
        p.direccion,
        p.email,
        p.mutual,
        p.nro_afiliado,
        p.grupo_sanguineo,
        p.estado,
        p.fecha_alta,
        COALESCE(COUNT(o.id_orden), 0) as total_ordenes,
        MAX(o.fecha_ingreso_orden) as ultima_orden
      FROM paciente p
      LEFT JOIN orden o ON p.nro_ficha = o.nro_ficha_paciente
      WHERE ${whereClause}
      GROUP BY p.nro_ficha, p.Nombre_paciente, p.Apellido_paciente, p.DNI,
               p.fecha_nacimiento, p.edad, p.sexo, p.telefono, p.direccion,
               p.email, p.mutual, p.nro_afiliado, p.grupo_sanguineo, p.estado, p.fecha_alta
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limite, offset);

    const [pacientesRows]: [any[], any] = await pool.query(mainQuery, queryParams);

    // Contar total
    const countQuery = `
      SELECT COUNT(DISTINCT p.nro_ficha) as total
      FROM paciente p
      WHERE ${whereClause}
    `;

    const [countRows]: [any[], any] = await pool.query(countQuery, queryParams.slice(0, -2));
    const total = countRows[0]?.total || 0;

    const pacientes = pacientesRows.map((paciente: any) => ({
      nro_ficha: paciente.nro_ficha,
      nombre: paciente.Nombre_paciente,
      apellido: paciente.Apellido_paciente,
      dni: parseInt(paciente.DNI),
      fecha_nacimiento: paciente.fecha_nacimiento,
      edad: paciente.edad,
      sexo: paciente.sexo,
      telefono: paciente.telefono,
      direccion: paciente.direccion,
      email: paciente.email,
      mutual: paciente.mutual,
      nro_afiliado: paciente.nro_afiliado,
      grupo_sanguineo: paciente.grupo_sanguineo,
      estado: paciente.estado,
      fecha_alta: paciente.fecha_alta,
      total_ordenes: parseInt(paciente.total_ordenes),
      ultima_orden: paciente.ultima_orden
    }));

    console.log('✅ Pacientes admin obtenidos:', pacientes.length);

    return res.status(200).json({
      success: true,
      pacientes,
      total,
      pagina_actual: pagina,
      total_paginas: Math.ceil(total / limite),
      filtros_aplicados: { buscar, mutual, sexo, orden }
    });

  } catch (error: any) {
    console.error('💥 ERROR al obtener pacientes admin:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al obtener pacientes'
    });
  }
};

// GESTIÓN DE USUARIOS (ADMIN)
export const getAllUsuariosAdmin = async (req: Request, res: Response) => {
  try {
    console.log('👤 Admin obteniendo todos los usuarios');

    const [usuariosRows]: any = await pool.query(
      `SELECT 
        u.id_usuario,
        u.username,
        u.email,
        u.rol,
        u.activo,
        u.fecha_creacion,
        u.ultimo_acceso,
        u.intentos_fallidos,
        CASE 
          WHEN u.rol = 'medico' THEN CONCAT(m.nombre_medico, ' ', m.apellido_medico)
          WHEN u.rol = 'bioquimico' THEN CONCAT(b.nombre_bq, ' ', b.apellido_bq)
          ELSE u.username
        END as nombre_completo,
        CASE 
          WHEN u.rol = 'medico' THEN m.matricula_medica
          WHEN u.rol = 'bioquimico' THEN b.matricula_profesional
          ELSE NULL
        END as matricula
       FROM usuarios u
       LEFT JOIN medico m ON u.id_usuario = m.id_usuario AND u.rol = 'medico'
       LEFT JOIN bioquimico b ON u.id_usuario = b.id_usuario AND u.rol = 'bioquimico'
       ORDER BY u.fecha_creacion DESC`
    );

    const usuarios = usuariosRows.map((usuario: any) => ({
      id_usuario: usuario.id_usuario,
      username: usuario.username,
      email: usuario.email,
      rol: usuario.rol,
      activo: usuario.activo === 1,
      fecha_creacion: usuario.fecha_creacion,
      ultimo_acceso: usuario.ultimo_acceso,
      intentos_fallidos: usuario.intentos_fallidos,
      nombre_completo: usuario.nombre_completo,
      matricula: usuario.matricula
    }));

    console.log('✅ Usuarios admin obtenidos:', usuarios.length);

    return res.status(200).json({
      success: true,
      usuarios,
      total: usuarios.length
    });

  } catch (error: any) {
    console.error('💥 ERROR al obtener usuarios admin:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al obtener usuarios'
    });
  }
};