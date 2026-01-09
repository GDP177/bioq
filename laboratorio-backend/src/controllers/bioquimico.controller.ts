// laboratorio-backend/src/controllers/bioquimico.controller.ts

import { Request, Response } from 'express';
import { pool } from '../routes/db';

// COMPLETAR PERFIL BIOQUÍMICO
export const completarPerfilBioquimico = async (req: Request, res: Response) => {
  const { 
    id_usuario,
    nombre_bq,
    apellido_bq,
    dni_bioquimico,
    matricula_profesional,
    telefono,
    direccion,
    fecha_habilitacion,
    fecha_vencimiento_matricula
  } = req.body;

  try {
    console.log('📝 COMPLETANDO PERFIL BIOQUÍMICO para usuario ID:', id_usuario);

    // Validaciones básicas
    if (!id_usuario || !nombre_bq || !apellido_bq || !dni_bioquimico || !matricula_profesional) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos obligatorios: nombre, apellido, DNI y matrícula son requeridos'
      });
    }

    // Verificar que el usuario existe y es bioquímico
    const [userRows]: any = await pool.query(
      'SELECT id_usuario, rol FROM usuarios WHERE id_usuario = ? AND rol = "bioquimico" AND activo = 1',
      [id_usuario]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado o no es bioquímico'
      });
    }

    // Verificar que no existe ya un perfil
    const [existingRows]: any = await pool.query(
      'SELECT matricula_profesional FROM bioquimico WHERE id_usuario = ?',
      [id_usuario]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'El perfil bioquímico ya existe para este usuario'
      });
    }

    // Verificar que DNI y matrícula no estén duplicados
    const [duplicateRows]: any = await pool.query(
      'SELECT matricula_profesional FROM bioquimico WHERE dni_bioquimico = ? OR matricula_profesional = ?',
      [dni_bioquimico, matricula_profesional]
    );

    if (duplicateRows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'DNI o matrícula ya registrados'
      });
    }

    // Insertar perfil bioquímico
    const [result]: any = await pool.query(
      `INSERT INTO bioquimico (
        id_usuario,
        nombre_bq,
        apellido_bq,
        dni_bioquimico,
        matricula_profesional,
        telefono,
        direccion,
        email,
        fecha_habilitacion,
        fecha_vencimiento_matricula,
        activo,
        fecha_creacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 
        (SELECT email FROM usuarios WHERE id_usuario = ?), 
        ?, ?, 1, NOW())`,
      [
        id_usuario,
        nombre_bq,
        apellido_bq,
        dni_bioquimico,
        matricula_profesional,
        telefono || null,
        direccion || null,
        id_usuario,
        fecha_habilitacion || null,
        fecha_vencimiento_matricula || null
      ]
    );

    console.log('✅ Perfil bioquímico creado exitosamente');

    // Obtener perfil completo para la respuesta
    const [newBioquimicoRows]: any = await pool.query(
      `SELECT 
        b.matricula_profesional,
        b.nombre_bq,
        b.apellido_bq,
        b.dni_bioquimico,
        b.telefono,
        b.direccion,
        b.email,
        b.fecha_habilitacion,
        b.fecha_vencimiento_matricula,
        u.username,
        u.rol
       FROM bioquimico b
       JOIN usuarios u ON b.id_usuario = u.id_usuario
       WHERE b.matricula_profesional = ?`,
      [matricula_profesional]
    );

    const bioquimico = newBioquimicoRows[0];

    return res.status(201).json({
      success: true,
      message: 'Perfil bioquímico completado exitosamente',
      usuario: {
        id: bioquimico.matricula_profesional,
        id_usuario: id_usuario,
        nombre: bioquimico.nombre_bq,
        apellido: bioquimico.apellido_bq,
        email: bioquimico.email,
        dni: bioquimico.dni_bioquimico,
        matricula: bioquimico.matricula_profesional,
        telefono: bioquimico.telefono,
        direccion: bioquimico.direccion,
        fecha_habilitacion: bioquimico.fecha_habilitacion,
        fecha_vencimiento_matricula: bioquimico.fecha_vencimiento_matricula,
        rol: bioquimico.rol
      }
    });

  } catch (error: any) {
    console.error('💥 ERROR AL COMPLETAR PERFIL BIOQUÍMICO:', error);
    
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

// DASHBOARD BIOQUÍMICO
export const getDashboardBioquimico = async (req: Request, res: Response) => {
  const matricula_profesional = req.params.matricula_profesional;

  try {
    console.log('📊 DASHBOARD BIOQUÍMICO - Matrícula:', matricula_profesional);

    if (!matricula_profesional) {
      return res.status(400).json({ 
        success: false,
        message: 'Matrícula profesional inválida' 
      });
    }

    // 1. OBTENER DATOS DEL BIOQUÍMICO
    const [bioquimicoRows]: any = await pool.query(
      `SELECT 
        b.matricula_profesional,
        b.nombre_bq, 
        b.apellido_bq,
        b.email,
        b.telefono,
        b.fecha_habilitacion,
        b.fecha_vencimiento_matricula
       FROM bioquimico b 
       WHERE b.matricula_profesional = ? AND b.activo = 1`, 
      [matricula_profesional]
    );

    if (bioquimicoRows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Bioquímico no encontrado' 
      });
    }

    const bioquimico = bioquimicoRows[0];

    // 2. ESTADÍSTICAS DE ÓRDENES
    const [ordenesStats]: any = await pool.query(
      `SELECT 
        COUNT(*) as total_ordenes,
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as ordenes_pendientes,
        COUNT(CASE WHEN estado = 'en_proceso' THEN 1 END) as ordenes_proceso,
        COUNT(CASE WHEN estado = 'finalizado' THEN 1 END) as ordenes_completadas,
        COUNT(CASE WHEN DATE(fecha_ingreso_orden) = CURDATE() THEN 1 END) as ordenes_hoy
       FROM orden 
       WHERE DATE(fecha_ingreso_orden) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`
    );

    const statsOrdenes = ordenesStats[0] || {};

    // 3. ÓRDENES PENDIENTES DE PROCESAMIENTO
    const [ordenesPendientes]: any = await pool.query(
      `SELECT 
        o.id_orden,
        o.nro_orden,
        o.fecha_ingreso_orden,
        o.estado,
        o.urgente,
        p.Nombre_paciente as nombre_paciente,
        p.Apellido_paciente as apellido_paciente,
        p.DNI as dni,
        COUNT(oa.id_orden_analisis) as total_analisis
       FROM orden o
       JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
       LEFT JOIN orden_analisis oa ON o.id_orden = oa.id_orden
       WHERE o.estado IN ('pendiente', 'en_proceso')
       GROUP BY o.id_orden, o.nro_orden, o.fecha_ingreso_orden, o.estado, 
                o.urgente, p.Nombre_paciente, p.Apellido_paciente, p.DNI
       ORDER BY o.urgente DESC, o.fecha_ingreso_orden ASC
       LIMIT 20`
    );

    // 4. ANÁLISIS POR PROCESAR
    const [analisisPendientes]: any = await pool.query(
      `SELECT 
        oa.id_orden_analisis,
        oa.codigo_practica,
        oa.estado,
        o.id_orden,
        o.nro_orden,
        o.urgente,
        p.Nombre_paciente as nombre_paciente,
        p.Apellido_paciente as apellido_paciente
       FROM orden_analisis oa
       JOIN orden o ON oa.id_orden = o.id_orden
       JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
       WHERE oa.estado IN ('pendiente', 'en_proceso')
       ORDER BY o.urgente DESC, o.fecha_ingreso_orden ASC
       LIMIT 15`
    );

    // 5. NOTIFICACIONES
    const notificaciones = [];
    
    if (parseInt(statsOrdenes.ordenes_pendientes) > 0) {
      notificaciones.push(`⚠️ ${statsOrdenes.ordenes_pendientes} órdenes pendientes de procesamiento`);
    }
    
    if (parseInt(statsOrdenes.ordenes_hoy) > 0) {
      notificaciones.push(`📅 ${statsOrdenes.ordenes_hoy} órdenes ingresadas hoy`);
    }

    if (notificaciones.length === 0) {
      notificaciones.push('🎉 ¡Todo al día! No hay notificaciones pendientes');
    }

    // 6. CONSTRUIR RESPUESTA
    const dashboardData = {
      success: true,
      bioquimico: {
        matricula: bioquimico.matricula_profesional,
        nombre: bioquimico.nombre_bq,
        apellido: bioquimico.apellido_bq,
        email: bioquimico.email,
        telefono: bioquimico.telefono,
        fecha_habilitacion: bioquimico.fecha_habilitacion,
        fecha_vencimiento_matricula: bioquimico.fecha_vencimiento_matricula
      },
      estadisticas: {
        total_ordenes: parseInt(statsOrdenes.total_ordenes) || 0,
        ordenes_pendientes: parseInt(statsOrdenes.ordenes_pendientes) || 0,
        ordenes_proceso: parseInt(statsOrdenes.ordenes_proceso) || 0,
        ordenes_completadas: parseInt(statsOrdenes.ordenes_completadas) || 0,
        ordenes_hoy: parseInt(statsOrdenes.ordenes_hoy) || 0
      },
      ordenes_pendientes: ordenesPendientes.map((orden: any) => ({
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
        total_analisis: orden.total_analisis
      })),
      analisis_pendientes: analisisPendientes.map((analisis: any) => ({
        id: analisis.id_orden_analisis,
        codigo_practica: analisis.codigo_practica,
        estado: analisis.estado,
        orden: {
          id: analisis.id_orden,
          nro_orden: analisis.nro_orden,
          urgente: analisis.urgente === 1
        },
        paciente: {
          nombre: analisis.nombre_paciente,
          apellido: analisis.apellido_paciente
        }
      })),
      notificaciones,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Dashboard bioquímico preparado exitosamente');

    return res.status(200).json(dashboardData);

  } catch (error) {
    console.error("💥 ERROR EN DASHBOARD BIOQUÍMICO:", error);
    return res.status(500).json({ 
      success: false,
      message: "Error al obtener dashboard bioquímico",
      error: process.env.NODE_ENV === 'development' ? error?.toString() : undefined
    });
  }
};

// GESTIÓN DE ÓRDENES BIOQUÍMICO
export const getOrdenesBioquimico = async (req: Request, res: Response) => {
  const estado = req.query.estado as string || 'todas';
  const fecha = req.query.fecha as string || 'todas';
  const buscar = req.query.buscar as string || '';
  const limite = parseInt(req.query.limite as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  try {
    console.log('📋 Obteniendo órdenes para bioquímico - Filtros:', { estado, fecha, buscar });

    let whereConditions = ['1=1'];
    let queryParams: any[] = [];

    // Filtro por estado
    if (estado !== 'todas') {
      whereConditions.push('o.estado = ?');
      queryParams.push(estado);
    }

    // Filtro por fecha
    if (fecha === 'hoy') {
      whereConditions.push('DATE(o.fecha_ingreso_orden) = CURDATE()');
    } else if (fecha === 'semana') {
      whereConditions.push('DATE(o.fecha_ingreso_orden) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)');
    }

    // Filtro de búsqueda
    if (buscar) {
      const searchTerm = `%${buscar}%`;
      whereConditions.push(`(
        o.nro_orden LIKE ? OR 
        p.Nombre_paciente LIKE ? OR 
        p.Apellido_paciente LIKE ? OR 
        p.DNI LIKE ?
      )`);
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.join(' AND ');

    // Query principal para órdenes
    const mainQuery = `
      SELECT 
        o.id_orden,
        o.nro_orden,
        o.fecha_ingreso_orden,
        o.fecha_procesamiento,
        o.fecha_finalizacion,
        o.estado,
        o.urgente,
        p.Nombre_paciente as nombre_paciente,
        p.Apellido_paciente as apellido_paciente,
        p.DNI as dni,
        p.mutual,
        COUNT(oa.id_orden_analisis) as total_analisis,
        COUNT(CASE WHEN oa.estado = 'finalizado' THEN 1 END) as analisis_finalizados
      FROM orden o
      JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
      LEFT JOIN orden_analisis oa ON o.id_orden = oa.id_orden
      WHERE ${whereClause}
      GROUP BY o.id_orden, o.nro_orden, o.fecha_ingreso_orden, o.fecha_procesamiento,
               o.fecha_finalizacion, o.estado, o.urgente, p.Nombre_paciente,
               p.Apellido_paciente, p.DNI, p.mutual
      ORDER BY o.urgente DESC, o.fecha_ingreso_orden DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limite, offset);

    const [ordenes]: any = await pool.query(mainQuery, queryParams);

    // Query para contar total de registros
    const countQuery = `
      SELECT COUNT(DISTINCT o.id_orden) as total
      FROM orden o
      JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
      WHERE ${whereClause}
    `;

    const [countResult]: any = await pool.query(countQuery, queryParams.slice(0, -2));
    const totalRegistros = countResult[0]?.total || 0;

    // Transformar datos para respuesta
    const ordenesTransformadas = ordenes.map((orden: any) => ({
      id: orden.id_orden,
      nro_orden: orden.nro_orden || `ORD-${orden.id_orden}`,
      fecha_ingreso: orden.fecha_ingreso_orden,
      fecha_procesamiento: orden.fecha_procesamiento,
      fecha_finalizacion: orden.fecha_finalizacion,
      estado: orden.estado,
      urgente: orden.urgente === 1,
      paciente: {
        nombre: orden.nombre_paciente,
        apellido: orden.apellido_paciente,
        dni: orden.dni,
        mutual: orden.mutual
      },
      estadisticas: {
        total_analisis: orden.total_analisis,
        analisis_finalizados: orden.analisis_finalizados,
        analisis_pendientes: orden.total_analisis - orden.analisis_finalizados
      },
      progreso: orden.total_analisis > 0 ? 
        Math.round((orden.analisis_finalizados / orden.total_analisis) * 100) : 0
    }));

    console.log(`✅ Obtenidas ${ordenes.length} órdenes de ${totalRegistros} total`);

    return res.status(200).json({
      success: true,
      ordenes: ordenesTransformadas,
      paginacion: {
        total: totalRegistros,
        limite: limite,
        offset: offset,
        pagina_actual: Math.floor(offset / limite) + 1,
        total_paginas: Math.ceil(totalRegistros / limite)
      },
      filtros: {
        estado,
        fecha,
        buscar
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 ERROR AL OBTENER ÓRDENES BIOQUÍMICO:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes',
      error: process.env.NODE_ENV === 'development' ? error?.toString() : undefined
    });
  }
};

// PROCESAR ORDEN - CAMBIAR ESTADO A "EN PROCESO"
export const procesarOrden = async (req: Request, res: Response) => {
  const { id_orden } = req.params;
  const { matricula_bioquimico } = req.body;

  try {
    console.log(`🔄 PROCESANDO ORDEN ${id_orden} por bioquímico ${matricula_bioquimico}`);

    // Verificar que la orden existe y está en estado válido para procesamiento
    const [ordenRows]: any = await pool.query(
      'SELECT id_orden, estado FROM orden WHERE id_orden = ?',
      [id_orden]
    );

    if (ordenRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    const orden = ordenRows[0];

    if (orden.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        message: `La orden está en estado "${orden.estado}" y no puede ser procesada`
      });
    }

    // Actualizar estado de la orden
    await pool.query(
      `UPDATE orden 
       SET estado = 'en_proceso', 
           fecha_procesamiento = NOW()
       WHERE id_orden = ?`,
      [id_orden]
    );

    // Actualizar análisis relacionados
    await pool.query(
      `UPDATE orden_analisis 
       SET estado = 'en_proceso'
       WHERE id_orden = ? AND estado = 'pendiente'`,
      [id_orden]
    );

    console.log(`✅ Orden ${id_orden} marcada como "en proceso"`);

    return res.status(200).json({
      success: true,
      message: 'Orden procesada exitosamente',
      orden: {
        id: id_orden,
        estado: 'en_proceso',
        fecha_procesamiento: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('💥 ERROR AL PROCESAR ORDEN:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar orden'
    });
  }
};

// CARGAR RESULTADO DE ANÁLISIS
export const cargarResultado = async (req: Request, res: Response) => {
  const { id_orden_analisis } = req.params;
  const { resultado, observaciones, valores_referencia } = req.body;

  try {
    console.log(`📝 CARGANDO RESULTADO para análisis ${id_orden_analisis}`);

    // Verificar que el análisis existe
    const [analisisRows]: any = await pool.query(
      'SELECT id_orden_analisis, estado FROM orden_analisis WHERE id_orden_analisis = ?',
      [id_orden_analisis]
    );

    if (analisisRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Análisis no encontrado'
      });
    }

    const analisis = analisisRows[0];

    if (analisis.estado === 'finalizado') {
      return res.status(400).json({
        success: false,
        message: 'El análisis ya está finalizado'
      });
    }

    // Actualizar resultado del análisis
    await pool.query(
      `UPDATE orden_analisis 
       SET resultado = ?,
           observaciones = ?,
           valores_referencia = ?,
           estado = 'finalizado',
           fecha_resultado = NOW()
       WHERE id_orden_analisis = ?`,
      [
        JSON.stringify(resultado),
        observaciones || null,
        JSON.stringify(valores_referencia) || null,
        id_orden_analisis
      ]
    );

    // Verificar si todos los análisis de la orden están finalizados
    const [estadoOrdenRows]: any = await pool.query(
      `SELECT 
        o.id_orden,
        COUNT(oa.id_orden_analisis) as total_analisis,
        COUNT(CASE WHEN oa.estado = 'finalizado' THEN 1 END) as analisis_finalizados
       FROM orden o
       JOIN orden_analisis oa ON o.id_orden = oa.id_orden
       WHERE oa.id_orden_analisis = ?
       GROUP BY o.id_orden`,
      [id_orden_analisis]
    );

    if (estadoOrdenRows.length > 0) {
      const estadoOrden = estadoOrdenRows[0];
      
      // Si todos los análisis están finalizados, finalizar la orden
      if (estadoOrden.total_analisis === estadoOrden.analisis_finalizados) {
        await pool.query(
          `UPDATE orden 
           SET estado = 'finalizado',
               fecha_finalizacion = NOW()
           WHERE id_orden = ?`,
          [estadoOrden.id_orden]
        );
        
        console.log(`✅ Orden ${estadoOrden.id_orden} finalizada completamente`);
      }
    }

    console.log(`✅ Resultado cargado exitosamente para análisis ${id_orden_analisis}`);

    return res.status(200).json({
      success: true,
      message: 'Resultado cargado exitosamente',
      analisis: {
        id: id_orden_analisis,
        estado: 'finalizado',
        fecha_resultado: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('💥 ERROR AL CARGAR RESULTADO:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al cargar resultado'
    });
  }
};

// OBTENER DETALLE DE ORDEN PARA CARGA DE RESULTADOS
export const getDetalleOrden = async (req: Request, res: Response) => {
  const { id_orden } = req.params;

  try {
    console.log(`📋 Obteniendo detalle de orden ${id_orden}`);

    // 1. Obtener datos de la orden y del paciente
    const [ordenRows]: any = await pool.query(
      `SELECT 
        o.id_orden,
        o.nro_orden,
        o.fecha_ingreso_orden,
        o.estado,
        o.urgente,
        p.Nombre_paciente AS nombre_paciente,
        p.Apellido_paciente AS apellido_paciente,
        p.DNI AS dni,
        p.fecha_nacimiento,
        p.sexo,
        p.edad,
        p.mutual
       FROM orden o
       JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
       WHERE o.id_orden = ?`,
      [id_orden]
    );

    if (ordenRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    const orden = ordenRows[0];

    // 2. Obtener análisis vinculando la tabla maestra 'analisis' para traer REFERENCIA
    // ... dentro de la función getDetalleOrden, actualiza la query de análisis:

    const [analisisRows]: any = await pool.query(`
      SELECT 
        oa.id_orden_analisis,
        oa.codigo_practica,
        a.descripcion_practica AS descripcion_analisis,
        a.unidad_bioquimica,      -- ✅ Agregado
        a.codigo_modulo,          -- ✅ Agregado
        a.URGENCIA,               -- ✅ Agregado
        oa.estado,
        oa.valor_hallado,
        oa.unidad_hallada,
        COALESCE(oa.valor_referencia_aplicado, a.REFERENCIA) AS valor_referencia_final,
        oa.observaciones
      FROM orden_analisis oa
      LEFT JOIN analisis a ON oa.codigo_practica = a.codigo_practica
      WHERE oa.id_orden = ?
      ORDER BY oa.codigo_practica`, [id_orden]);

    const analisisTransformados = analisisRows.map((a: any) => ({
      id: a.id_orden_analisis,
      codigo: a.codigo_practica,
      descripcion: a.descripcion_analisis || `Análisis ${a.codigo_practica}`,
      modulo: a.codigo_modulo,      // ✅ Nuevo
      ub: a.unidad_bioquimica,      // ✅ Nuevo (Unidades Bioquímicas)
      urgencia: a.URGENCIA,         // ✅ Nuevo
      estado: a.estado,
      resultado: a.valor_hallado || null,
      unidad: a.unidad_bioquimica || a.unidad_hallada || '',
      referencia: a.valor_referencia_final || 'No posee',
      observaciones: a.observaciones || null
    }));

    console.log(`✅ Detalle de orden ${id_orden} obtenido exitosamente`);

    return res.status(200).json({
      success: true,
      orden: {
        id: orden.id_orden,
        nro_orden: orden.nro_orden || `ORD-${orden.id_orden}`,
        fecha_ingreso: orden.fecha_ingreso_orden,
        estado: orden.estado,
        urgente: orden.urgente === 1,
        paciente: {
          nombre: orden.nombre_paciente,
          apellido: orden.apellido_paciente,
          dni: orden.dni,
          fecha_nacimiento: orden.fecha_nacimiento,
          sexo: orden.sexo,
          edad: orden.edad,
          mutual: orden.mutual
        },
        analisis: analisisTransformados
      }
    });

  } catch (error: any) {
    console.error('💥 ERROR AL OBTENER DETALLE DE ORDEN:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener detalle de orden',
      error: error.message
    });
  }
};