// src/controllers/orden.controller.ts - CONTROLADOR PARA GESTIÓN DE ÓRDENES

import { Request, Response } from 'express';
import { pool } from '../routes/db';

// OBTENER ÓRDENES DEL MÉDICO CON FILTROS
export const getOrdenesMedico = async (req: Request, res: Response) => {
  const id_medico = parseInt(req.params.id_medico);
  const { estado, urgente, buscar, limite = 50, offset = 0 } = req.query;

  try {
    console.log('📋 Obteniendo órdenes para médico ID:', id_medico);
    console.log('🔍 Filtros aplicados:', { estado, urgente, buscar });

    if (!id_medico || isNaN(id_medico)) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de médico inválido' 
      });
    }

    // Construir WHERE clause dinámicamente
    let whereConditions = ['o.id_medico_solicitante = ?'];
    let queryParams: any[] = [id_medico];

    if (estado && estado !== 'todos') {
      if (estado === 'urgente') {
        whereConditions.push('o.urgente = 1');
      } else {
        whereConditions.push('o.estado = ?');
        queryParams.push(estado);
      }
    }

    if (urgente === 'true') {
      whereConditions.push('o.urgente = 1');
    }

    if (buscar) {
      whereConditions.push(`(
        p.nombre_paciente LIKE ? OR 
        p.apellido_paciente LIKE ? OR 
        p.dni LIKE ? OR 
        o.nro_orden LIKE ?
      )`);
      const searchTerm = `%${buscar}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.join(' AND ');

    // Query principal
    const mainQuery = `
      SELECT 
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
      WHERE ${whereClause}
      GROUP BY o.id_orden, o.nro_orden, o.fecha_ingreso_orden, o.fecha_procesamiento, 
               o.fecha_finalizacion, o.estado, o.urgente, o.observaciones,
               p.nombre_paciente, p.apellido_paciente, p.dni, p.mutual, p.edad
      ORDER BY o.fecha_ingreso_orden DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limite as string), parseInt(offset as string));

    const [ordenesRows]: any = await pool.query(mainQuery, queryParams);

    console.log('📊 Órdenes encontradas:', ordenesRows.length);

    // Query para contar total (sin límite)
    const countQuery = `
      SELECT COUNT(DISTINCT o.id_orden) as total
      FROM orden o
      JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
      LEFT JOIN orden_analisis oa ON o.id_orden = oa.id_orden
      WHERE ${whereClause}
    `;

    const [countRows]: any = await pool.query(countQuery, queryParams.slice(0, -2));
    const total = countRows[0]?.total || 0;

    // Formatear respuesta
    const ordenes = ordenesRows.map((orden: any) => ({
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
    }));

    const response = {
      success: true,
      ordenes,
      total,
      pagina_actual: Math.floor(parseInt(offset as string) / parseInt(limite as string)) + 1,
      total_paginas: Math.ceil(total / parseInt(limite as string)),
      filtros_aplicados: {
        estado: estado as string,
        urgente: urgente === 'true',
        buscar: buscar as string
      }
    };

    console.log('✅ Respuesta preparada:', {
      total_ordenes: ordenes.length,
      total_registros: total,
      filtros: response.filtros_aplicados
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error('💥 ERROR al obtener órdenes:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al obtener órdenes',
      error: process.env.NODE_ENV === 'development' ? error?.toString() : undefined
    });
  }
};

// OBTENER DETALLE DE UNA ORDEN ESPECÍFICA
export const getOrdenDetalle = async (req: Request, res: Response) => {
  const id_orden = parseInt(req.params.id_orden);
  const id_medico = parseInt(req.params.id_medico);

  try {
    console.log('🔍 Obteniendo detalle de orden ID:', id_orden, 'para médico:', id_medico);

    if (!id_orden || isNaN(id_orden) || !id_medico || isNaN(id_medico)) {
      return res.status(400).json({ 
        success: false,
        message: 'IDs inválidos' 
      });
    }

    // Verificar que la orden pertenece al médico
    const [ordenRows]: any = await pool.query(
      `SELECT 
        o.id_orden,
        o.nro_orden,
        o.fecha_ingreso_orden,
        o.fecha_procesamiento,
        o.fecha_finalizacion,
        o.fecha_toma_muestra,
        o.estado,
        o.urgente,
        o.observaciones,
        o.instrucciones_paciente,
        o.requiere_ayuno,
        o.costo_total,
        p.nro_ficha,
        p.nombre_paciente,
        p.apellido_paciente,
        p.dni,
        p.fecha_nacimiento,
        p.edad,
        p.sexo,
        p.telefono,
        p.direccion,
        p.email,
        p.mutual,
        p.nro_afiliado,
        p.grupo_sanguineo,
        m.nombre_medico,
        m.apellido_medico,
        m.especialidad,
        m.matricula_medica,
        b.nombre_bq,
        b.apellido_bq
       FROM orden o
       JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
       JOIN medico m ON o.id_medico_solicitante = m.id_medico
       LEFT JOIN bioquimico b ON o.matricula_bq_efectua = b.matricula_profesional
       WHERE o.id_orden = ? AND o.id_medico_solicitante = ?`,
      [id_orden, id_medico]
    );

    if (ordenRows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Orden no encontrada o no autorizada' 
      });
    }

    const orden = ordenRows[0];

    // Obtener análisis de la orden
    const [analisisRows]: any = await pool.query(
      `SELECT 
        oa.id_orden_analisis,
        oa.codigo_practica,
        oa.estado,
        oa.fecha_realizacion,
        oa.valor_hallado,
        oa.unidad_hallada,
        oa.valor_referencia_aplicado,
        oa.interpretacion,
        oa.observaciones,
        oa.tecnico_responsable,
        a.descripcion_practica,
        a.TIPO as tipo_analisis
       FROM orden_analisis oa
       JOIN analisis a ON oa.codigo_practica = a.codigo_practica
       WHERE oa.id_orden = ?
       ORDER BY a.descripcion_practica`,
      [id_orden]
    );

    console.log('🧪 Análisis encontrados:', analisisRows.length);

    // Formatear respuesta
    const detalleOrden = {
      success: true,
      orden: {
        id: orden.id_orden,
        nro_orden: orden.nro_orden || `ORD-${orden.id_orden}`,
        fecha_ingreso: orden.fecha_ingreso_orden,
        fecha_procesamiento: orden.fecha_procesamiento,
        fecha_finalizacion: orden.fecha_finalizacion,
        fecha_toma_muestra: orden.fecha_toma_muestra,
        estado: orden.estado,
        urgente: orden.urgente === 1,
        observaciones: orden.observaciones,
        instrucciones_paciente: orden.instrucciones_paciente,
        requiere_ayuno: orden.requiere_ayuno === 1,
        costo_total: orden.costo_total,
        
        paciente: {
          nro_ficha: orden.nro_ficha,
          nombre: orden.nombre_paciente,
          apellido: orden.apellido_paciente,
          dni: orden.dni,
          fecha_nacimiento: orden.fecha_nacimiento,
          edad: orden.edad,
          sexo: orden.sexo,
          telefono: orden.telefono,
          direccion: orden.direccion,
          email: orden.email,
          mutual: orden.mutual,
          nro_afiliado: orden.nro_afiliado,
          grupo_sanguineo: orden.grupo_sanguineo
        },
        
        medico_solicitante: {
          nombre: orden.nombre_medico,
          apellido: orden.apellido_medico,
          especialidad: orden.especialidad,
          matricula: orden.matricula_medica
        },
        
        bioquimico_responsable: orden.nombre_bq ? {
          nombre: orden.nombre_bq,
          apellido: orden.apellido_bq
        } : null,
        
        analisis: analisisRows.map((analisis: any) => ({
          id: analisis.id_orden_analisis,
          codigo: analisis.codigo_practica,
          descripcion: analisis.descripcion_practica,
          tipo: analisis.tipo_analisis,
          estado: analisis.estado,
          fecha_realizacion: analisis.fecha_realizacion,
          valor_hallado: analisis.valor_hallado,
          unidad_hallada: analisis.unidad_hallada,
          valor_referencia: analisis.valor_referencia_aplicado,
          interpretacion: analisis.interpretacion,
          observaciones: analisis.observaciones,
          tecnico_responsable: analisis.tecnico_responsable
        })),
        
        resumen: {
          total_analisis: analisisRows.length,
          analisis_pendientes: analisisRows.filter((a: any) => a.estado === 'pendiente').length,
          analisis_procesando: analisisRows.filter((a: any) => a.estado === 'procesando').length,
          analisis_finalizados: analisisRows.filter((a: any) => a.estado === 'finalizado').length,
          porcentaje_completado: analisisRows.length > 0 ? 
            Math.round((analisisRows.filter((a: any) => a.estado === 'finalizado').length / analisisRows.length) * 100) : 0
        }
      }
    };

    console.log('✅ Detalle de orden preparado');

    return res.status(200).json(detalleOrden);

  } catch (error) {
    console.error('💥 ERROR al obtener detalle de orden:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al obtener detalle de orden',
      error: process.env.NODE_ENV === 'development' ? error?.toString() : undefined
    });
  }
};