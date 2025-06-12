// src/controllers/analisis.controller.ts - VERSIÓN CORREGIDA CON NOMBRES CORRECTOS

import { Request, Response } from 'express';
import { pool } from '../routes/db';

// ============================================
// FUNCIÓN PARA MANEJAR QUERY PARAMS
// ============================================

const getStringParam = (param: any): string => {
  if (typeof param === 'string') {
    return param.trim();
  }
  if (Array.isArray(param) && param.length > 0) {
    return String(param[0]).trim();
  }
  return '';
};

// ============================================
// OBTENER ANÁLISIS DEL MÉDICO - CORREGIDO
// ============================================

export const getAnalisisMedico = async (req: Request, res: Response) => {
  const id_medico = parseInt(req.params.id_medico);
  
  const estado = getStringParam(req.query.estado) || 'todos';
  const tipo = getStringParam(req.query.tipo) || 'todos';
  const buscar = getStringParam(req.query.buscar);
  const fecha_desde = getStringParam(req.query.fecha_desde);
  const fecha_hasta = getStringParam(req.query.fecha_hasta);

  try {
    console.log('🧪 ==========================================');
    console.log('🧪 OBTENIENDO ANÁLISIS PARA MÉDICO');
    console.log('🧪 ==========================================');
    console.log('🧪 ID Médico:', id_medico);
    console.log('🧪 Filtros:', { estado, tipo, buscar, fecha_desde, fecha_hasta });

    if (!id_medico || id_medico <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de médico inválido'
      });
    }

    // ============================================
    // CONSTRUIR QUERY BASADA EN TU ESTRUCTURA BD
    // ============================================

    let whereConditions = ['o.id_medico_solicitante = ?'];
    let queryParams: any[] = [id_medico];

    // Filtro por estado
    if (estado && estado !== 'todos') {
      switch (estado) {
        case 'pendiente':
          whereConditions.push('oa.estado = ?');
          queryParams.push('pendiente');
          break;
        case 'finalizado':
          whereConditions.push('oa.estado = ?');
          queryParams.push('finalizado');
          break;
        case 'procesando':
          whereConditions.push('oa.estado = ?');
          queryParams.push('procesando');
          break;
      }
    }

    // Filtro por tipo
    if (tipo && tipo !== 'todos') {
      whereConditions.push('a.TIPO = ?');
      queryParams.push(tipo);
    }

    // Filtro por búsqueda
    if (buscar && buscar.length > 0) {
      const searchTerm = `%${buscar}%`;
      whereConditions.push(`(
        a.descripcion_practica LIKE ? OR 
        p.Nombre_paciente LIKE ? OR 
        p.Apellido_paciente LIKE ? OR 
        p.DNI LIKE ?
      )`);
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Filtros por fecha
    if (fecha_desde && fecha_desde.length > 0) {
      whereConditions.push('DATE(o.fecha_ingreso_orden) >= ?');
      queryParams.push(fecha_desde);
    }

    if (fecha_hasta && fecha_hasta.length > 0) {
      whereConditions.push('DATE(o.fecha_ingreso_orden) <= ?');
      queryParams.push(fecha_hasta);
    }

    const whereClause = whereConditions.join(' AND ');

    // ============================================
    // QUERY PRINCIPAL AJUSTADA A TU BD
    // ============================================

    const mainQuery = `
      SELECT 
        oa.id_orden_analisis,
        oa.codigo_practica,
        oa.estado as analisis_estado,
        oa.fecha_realizacion,
        oa.valor_hallado,
        oa.unidad_hallada,
        oa.observaciones as analisis_observaciones,
        COALESCE(a.descripcion_practica, 'Análisis no especificado') as descripcion_practica,
        COALESCE(a.TIPO, 'General') as tipo,
        o.id_orden,
        o.nro_orden,
        o.fecha_ingreso_orden,
        COALESCE(o.urgente, 0) as urgente,
        p.Nombre_paciente as nombre_paciente,
        p.Apellido_paciente as apellido_paciente,
        p.DNI as dni,
        p.edad
      FROM orden_analisis oa
      JOIN orden o ON oa.id_orden = o.id_orden
      JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
      LEFT JOIN analisis a ON oa.codigo_practica = a.codigo_practica
      WHERE ${whereClause}
      ORDER BY o.fecha_ingreso_orden DESC, a.descripcion_practica ASC
      LIMIT 500
    `;

    console.log('🔍 Query ejecutándose:', mainQuery);
    console.log('🔍 Parámetros:', queryParams);

    const [analisisRows]: [any[], any] = await pool.query(mainQuery, queryParams);

    console.log('✅ Análisis encontrados:', analisisRows.length);

    // ============================================
    // QUERY DE ESTADÍSTICAS
    // ============================================

    const estadisticasQuery = `
      SELECT 
        COUNT(*) as total_analisis,
        SUM(CASE WHEN oa.estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN oa.estado = 'procesando' THEN 1 ELSE 0 END) as procesando,
        SUM(CASE WHEN oa.estado = 'finalizado' THEN 1 ELSE 0 END) as finalizados,
        SUM(CASE WHEN oa.valor_hallado IS NOT NULL AND oa.valor_hallado != '' THEN 1 ELSE 0 END) as con_resultados
      FROM orden_analisis oa
      JOIN orden o ON oa.id_orden = o.id_orden
      JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
      LEFT JOIN analisis a ON oa.codigo_practica = a.codigo_practica
      WHERE ${whereClause}
    `;

    const [estadisticasRows]: [any[], any] = await pool.query(estadisticasQuery, queryParams);
    const estadisticas = estadisticasRows[0] || {
      total_analisis: 0,
      pendientes: 0,
      procesando: 0,
      finalizados: 0,
      con_resultados: 0
    };

    console.log('📊 Estadísticas calculadas:', estadisticas);

    // ============================================
    // FORMATEAR RESPUESTA
    // ============================================

    const analisisFormateados = analisisRows.map((item: any) => {
      return {
        id: item.id_orden_analisis || Date.now() + Math.random(),
        codigo_practica: item.codigo_practica,
        descripcion: item.descripcion_practica,
        tipo: item.tipo,
        estado: item.analisis_estado,
        fecha_realizacion: item.fecha_realizacion,
        valor_hallado: item.valor_hallado,
        unidad_hallada: item.unidad_hallada,
        valor_referencia: null, // Agregar si tienes tabla de valores de referencia
        interpretacion: null, // Se puede calcular si tienes valores de referencia
        observaciones: item.analisis_observaciones,
        tecnico_responsable: null, // Agregar si tienes este campo
        orden: {
          id: item.id_orden,
          nro_orden: item.nro_orden || `ORD-${item.id_orden}`,
          fecha_ingreso: item.fecha_ingreso_orden,
          urgente: item.urgente === 1,
          paciente: {
            nombre: item.nombre_paciente,
            apellido: item.apellido_paciente,
            dni: item.dni,
            edad: item.edad
          }
        }
      };
    });

    // ============================================
    // RESPUESTA FINAL
    // ============================================

    console.log('✅ Análisis procesados y formateados:', analisisFormateados.length);
    console.log('🧪 ==========================================');

    return res.status(200).json({
      success: true,
      analisis: analisisFormateados,
      total: analisisRows.length,
      estadisticas: {
        total_analisis: parseInt(estadisticas.total_analisis) || 0,
        pendientes: parseInt(estadisticas.pendientes) || 0,
        procesando: parseInt(estadisticas.procesando) || 0,
        finalizados: parseInt(estadisticas.finalizados) || 0,
        con_resultados: parseInt(estadisticas.con_resultados) || 0
      },
      filtros_aplicados: {
        estado, tipo, buscar, fecha_desde, fecha_hasta
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('💥 ==========================================');
    console.error('💥 ERROR AL OBTENER ANÁLISIS');
    console.error('💥 ==========================================');
    console.error('💥 Error completo:', error);
    console.error('💥 Stack:', error.stack);
    console.error('💥 ==========================================');
    
    return res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor al obtener análisis',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error.code,
        sqlState: error.sqlState
      } : 'Error interno del servidor'
    });
  }
};

// ============================================
// OBTENER TIPOS DE ANÁLISIS
// ============================================

export const getTiposAnalisis = async (req: Request, res: Response) => {
  try {
    console.log('📋 Obteniendo tipos de análisis disponibles...');

    const [tiposRows]: [any[], any] = await pool.query(
      `SELECT DISTINCT TIPO as tipo, COUNT(*) as cantidad
       FROM analisis 
       WHERE TIPO IS NOT NULL AND TIPO != ''
       GROUP BY TIPO
       ORDER BY cantidad DESC, TIPO ASC`
    );

    console.log('✅ Tipos de análisis obtenidos:', tiposRows.length);

    return res.status(200).json({
      success: true,
      tipos: tiposRows.map((tipo: any) => ({
        tipo: tipo.tipo,
        cantidad: tipo.cantidad
      }))
    });

  } catch (error: any) {
    console.error('💥 ERROR al obtener tipos de análisis:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener tipos de análisis'
    });
  }
};

// ============================================
// OBTENER ANÁLISIS DISPONIBLES
// ============================================

export const getAnalisisDisponibles = async (req: Request, res: Response) => {
  try {
    console.log('📋 Obteniendo análisis disponibles...');

    const [analisisRows]: [any[], any] = await pool.query(
      `SELECT 
        codigo_practica as codigo,
        descripcion_practica as descripcion,
        TIPO as tipo,
        HONORARIOS as precio
       FROM analisis 
       WHERE descripcion_practica IS NOT NULL
       ORDER BY descripcion_practica ASC`
    );

    console.log('✅ Análisis disponibles obtenidos:', analisisRows.length);

    return res.status(200).json({
      success: true,
      analisis: analisisRows.map((analisis: any) => ({
        codigo: analisis.codigo,
        descripcion: analisis.descripcion,
        tipo: analisis.tipo,
        precio: analisis.precio || 0
      }))
    });

  } catch (error: any) {
    console.error('💥 ERROR al obtener análisis disponibles:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener análisis disponibles'
    });
  }
};