// src/controllers/orden.controller.ts - VERSIÓN CORREGIDA

import { Request, Response } from 'express';
import { pool } from '../routes/db';

// ============================================
// FUNCIONES AUXILIARES PARA QUERY PARAMS
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

const getNumberParam = (param: any, defaultValue: number): number => {
  if (typeof param === 'string') {
    const parsed = parseInt(param, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  if (Array.isArray(param) && param.length > 0) {
    const parsed = parseInt(String(param[0]), 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};

const getBooleanParam = (param: any): boolean => {
  if (typeof param === 'string') {
    return param.toLowerCase() === 'true';
  }
  if (Array.isArray(param) && param.length > 0) {
    return String(param[0]).toLowerCase() === 'true';
  }
  return false;
};

// ============================================
// OBTENER ÓRDENES DEL MÉDICO - FUNCIONA
// ============================================

export const getOrdenesMedico = async (req: Request, res: Response) => {
  const id_medico = parseInt(req.params.id_medico);
  
  const estado = getStringParam(req.query.estado);
  const urgente = getBooleanParam(req.query.urgente);
  const buscar = getStringParam(req.query.buscar);
  const limite = getNumberParam(req.query.limite, 50);
  const offset = getNumberParam(req.query.offset, 0);

  try {
    console.log('📋 ==========================================');
    console.log('📋 OBTENIENDO ÓRDENES PARA MÉDICO');
    console.log('📋 ==========================================');
    console.log('👨‍⚕️ ID Médico:', id_medico);
    console.log('🔍 Filtros aplicados:', { estado, urgente, buscar, limite, offset });

    if (!id_medico || isNaN(id_medico) || id_medico <= 0) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de médico inválido' 
      });
    }

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

    if (urgente) {
      whereConditions.push('o.urgente = 1');
    }

    if (buscar && buscar.length > 0) {
      const searchTerm = `%${buscar}%`;
      whereConditions.push(`(
        p.Nombre_paciente LIKE ? OR 
        p.Apellido_paciente LIKE ? OR 
        p.DNI LIKE ? OR 
        o.nro_orden LIKE ?
      )`);
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.join(' AND ');

    const mainQuery = `
      SELECT 
        o.id_orden,
        o.nro_orden,
        o.fecha_ingreso_orden,
        o.fecha_procesamiento,
        o.fecha_finalizacion,
        o.estado,
        COALESCE(o.urgente, 0) as urgente,
        o.observaciones,
        p.Nombre_paciente as nombre_paciente,
        p.Apellido_paciente as apellido_paciente,
        p.DNI as dni,
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
               p.Nombre_paciente, p.Apellido_paciente, p.DNI, p.mutual, p.edad
      ORDER BY o.fecha_ingreso_orden DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limite, offset);

    console.log('🔍 Query construida:', mainQuery);
    console.log('🔍 Parámetros:', queryParams);

    const [ordenesRows]: [any[], any] = await pool.query(mainQuery, queryParams);
    console.log('📊 Órdenes encontradas:', ordenesRows.length);

    const countQuery = `
      SELECT COUNT(DISTINCT o.id_orden) as total
      FROM orden o
      JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
      LEFT JOIN orden_analisis oa ON o.id_orden = oa.id_orden
      WHERE ${whereClause}
    `;

    const [countRows]: [any[], any] = await pool.query(countQuery, queryParams.slice(0, -2));
    const total = countRows[0]?.total || 0;

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
      pagina_actual: Math.floor(offset / limite) + 1,
      total_paginas: Math.ceil(total / limite),
      filtros_aplicados: { estado, urgente, buscar }
    };

    console.log('✅ Respuesta preparada:', {
      total_ordenes: ordenes.length,
      total_registros: total,
      filtros: response.filtros_aplicados
    });
    console.log('📋 ==========================================');

    return res.status(200).json(response);

  } catch (error: any) {
    console.error('💥 ERROR AL OBTENER ÓRDENES:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al obtener órdenes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// OBTENER DETALLE DE ORDEN - CORREGIDO
// ============================================

// src/controllers/orden.controller.ts
export const getOrdenDetalleFinal = async (req: Request, res: Response) => {
    const { id_orden } = req.params;
    try {
        const [ordenRows]: any = await pool.query(
            `SELECT o.*, p.Nombre_paciente as nombre, p.Apellido_paciente as apellido, p.DNI as dni, p.edad, p.sexo, p.mutual, p.grupo_sanguineo
             FROM orden o
             JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
             WHERE o.id_orden = ?`,
            [id_orden]
        );

        if (ordenRows.length === 0) return res.status(404).json({ success: false, message: "Orden no encontrada" });

        const [analisisRows]: any = await pool.query(
            `SELECT oa.*, a.descripcion_practica 
             FROM orden_analisis oa
             JOIN analisis a ON oa.codigo_practica = a.codigo_practica
             WHERE oa.id_orden = ?`,
            [id_orden]
        );

        return res.json({ success: true, orden: ordenRows[0], analisis: analisisRows });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};


export const getOrdenDetalle = async (req: Request, res: Response) => {
    const { id_orden } = req.params;
    try {
        const [ordenRows]: any = await pool.query(
            `SELECT o.*, p.Nombre_paciente as nombre, p.Apellido_paciente as apellido, p.DNI as dni, p.edad, p.sexo, p.mutual 
             FROM orden o JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha 
             WHERE o.id_orden = ?`, [id_orden]
        );

        if (ordenRows.length === 0) return res.status(404).json({ success: false });

        // JOIN para traer la descripción y el nuevo rango de referencia
        const [analisisRows]: any = await pool.query(
            `SELECT oa.*, a.descripcion_practica, a.valor_referencia_rango, a.TIPO
             FROM orden_analisis oa
             JOIN analisis a ON oa.codigo_practica = a.codigo_practica
             WHERE oa.id_orden = ?`, [id_orden]
        );

        return res.json({ 
            success: true, 
            orden: ordenRows[0], 
            analisis: analisisRows 
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// Obtener catálogo para el médico
export const getCatalogoAnalisis = async (req: Request, res: Response) => {
    try {
        const [rows]: any = await pool.query("SELECT * FROM analisis WHERE estado != 'INACTIVO'");
        res.json({ success: true, analisis: rows });
    } catch (error) {
        res.status(500).json({ success: false });
    }
};

// Crear solicitud unificada
export const crearSolicitud = async (req: Request, res: Response) => {
    const { nro_ficha_paciente, analisis_solicitados, urgente, observaciones, id_medico } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const nro_orden = `ORD-${Date.now()}`;

        // Insertar cabecera
        const [resOrden]: any = await connection.query(
            "INSERT INTO ordenes (nro_orden, urgente, id_medico_solicitante, nro_ficha_paciente, estado) VALUES (?, ?, ?, ?, 'pendiente')",
            [nro_orden, urgente ? 1 : 0, id_medico, nro_ficha_paciente]
        );

        // Insertar detalle
        for (const codigo of analisis_solicitados) {
            await connection.query(
                "INSERT INTO orden_analisis (id_orden, codigo_practica, estado) VALUES (?, ?, 'pendiente')",
                [resOrden.insertId, codigo]
            );
        }

        await connection.commit();
        res.json({ success: true, orden_id: resOrden.insertId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false });
    } finally { connection.release(); }
};
// ============================================
// CREAR SOLICITUD COMPLETA
// ============================================
export const crearSolicitudCompleta = async (req: Request, res: Response) => {
    const { nro_ficha_paciente, id_medico_solicitante, urgente, observaciones, analisis } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Insertar en tabla 'ordenes'
        const [resultOrden]: any = await connection.query(
            `INSERT INTO ordenes (nro_orden, urgente, id_medico_solicitante, fecha_ingreso_orden, nro_ficha_paciente, estado, observaciones) 
             VALUES (?, ?, ?, NOW(), ?, 'pendiente', ?)`,
            [`ORD-${Date.now()}`, urgente ? 1 : 0, id_medico_solicitante, nro_ficha_paciente, observaciones]
        );

        const id_orden = resultOrden.insertId;

        // 2. Insertar en tabla 'orden_analisis' cada práctica seleccionada
        for (const item of analisis) {
            await connection.query(
                `INSERT INTO orden_analisis (id_orden, codigo_practica, estado, fecha_creacion) 
                 VALUES (?, ?, 'pendiente', NOW())`,
                [id_orden, item.codigo]
            );
        }

        await connection.commit();
        res.json({ success: true, id_orden });
    } catch (error: any) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};


export const getCatalogo = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT codigo_practica, descripcion_practica, TIPO FROM analisis');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener catálogo' });
  }
};  

// src/controllers/orden.controller.ts

// src/controllers/orden.controller.ts
// src/controllers/orden.controller.ts

// src/controllers/orden.controller.ts
export const registrarOrden = async (req: Request, res: Response) => {
    const id_medico = parseInt(req.params.id); 
    const { nro_ficha_paciente, analisis_solicitados, urgente, observaciones, requiere_ayuno } = req.body;

    try {
        await pool.query('START TRANSACTION');

        // 1. Generar nro_orden (Formato: ORD-timestamp-random)
        const nro_orden = `ORD-${Date.now()}-${Math.floor(Math.random() * 100)}`;

        // 2. Insertar en tabla 'orden' (Columnas según image_da30ac)
        const [ordenResult]: any = await pool.query(
            `INSERT INTO orden 
            (nro_orden, urgente, id_medico_solicitante, fecha_ingreso_orden, nro_ficha_paciente, estado, observaciones, requiere_ayuno, fecha_creacion) 
            VALUES (?, ?, ?, NOW(), ?, 'pendiente', ?, ?, NOW())`,
            [nro_orden, urgente ? 1 : 0, id_medico, nro_ficha_paciente, observaciones || null, requiere_ayuno ? 1 : 0]
        );

        const id_nueva_orden = ordenResult.insertId;

        // 3. Insertar detalle en 'orden_analisis' (Columnas según image_da312c)
        for (const codigo_practica of analisis_solicitados) {
            await pool.query(
                `INSERT INTO orden_analisis (id_orden, codigo_practica, estado, fecha_creacion) 
                 VALUES (?, ?, 'pendiente', NOW())`,
                [id_nueva_orden, codigo_practica]
            );
        }

        await pool.query('COMMIT');

        // Devolvemos el ID real para la redirección del frontend
        return res.status(201).json({ 
            success: true, 
            orden_id: id_nueva_orden 
        });

    } catch (error: any) {
        await pool.query('ROLLBACK');
        console.error("Error al guardar orden:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};
// ============================================
// CREAR NUEVA ORDEN - YA ESTÁ BIEN
// ============================================

export const crearNuevaOrden = async (req: Request, res: Response) => {
  const id_medico = parseInt(req.params.id_medico);
  const {
    nro_ficha_paciente,
    analisis_solicitados,
    urgente,
    requiere_ayuno,
    observaciones,
    instrucciones_paciente
  } = req.body;

  try {
    console.log('➕ CREANDO NUEVA ORDEN');
    console.log('👨‍⚕️ Médico ID:', id_medico);
    console.log('👤 Paciente ficha:', nro_ficha_paciente);
    console.log('🧪 Análisis solicitados:', analisis_solicitados);

    if (!id_medico || !nro_ficha_paciente || !analisis_solicitados?.length) {
      return res.status(400).json({ 
        success: false,
        message: 'Datos incompletos para crear la orden' 
      });
    }

    await pool.query('START TRANSACTION');

    try {
      const [ultimaOrden]: [any[], any] = await pool.query(
        'SELECT MAX(id_orden) as ultima_orden FROM orden'
      );
      const proximoId = (ultimaOrden[0]?.ultima_orden || 0) + 1;
      const nro_orden = `ORD-${Date.now()}-${proximoId}`;

      console.log('📋 Número de orden generado:', nro_orden);

      let costo_total = 0;
      try {
        if (Array.isArray(analisis_solicitados) && analisis_solicitados.length > 0) {
          const codigosPlaceholders = analisis_solicitados.map(() => '?').join(',');
          const [costosRows]: [any[], any] = await pool.query(
            `SELECT SUM(COALESCE(HONORARIOS, 0) + COALESCE(GASTOS, 0)) as costo_total 
             FROM analisis 
             WHERE codigo_practica IN (${codigosPlaceholders})`,
            analisis_solicitados
          );
          costo_total = costosRows[0]?.costo_total || 0;
        }
      } catch (costoError) {
        console.log('⚠️ No se pudo calcular costo total, usando 0');
        costo_total = 0;
      }

      const [ordenResult]: [any, any] = await pool.query(
        `INSERT INTO orden (
          nro_orden, 
          nro_ficha_paciente, 
          id_medico_solicitante,
          fecha_ingreso_orden, 
          urgente, 
          estado, 
          observaciones,
          instrucciones_paciente, 
          requiere_ayuno, 
          costo_total
        ) VALUES (?, ?, ?, NOW(), ?, 'pendiente', ?, ?, ?, ?)`,
        [
          nro_orden, 
          nro_ficha_paciente, 
          id_medico,
          urgente ? 1 : 0, 
          observaciones || null, 
          instrucciones_paciente || null,
          requiere_ayuno ? 1 : 0, 
          costo_total
        ]
      );

      const orden_id = ordenResult.insertId;
      console.log('✅ Orden creada con ID:', orden_id);

      if (Array.isArray(analisis_solicitados)) {
        for (const codigo_practica of analisis_solicitados) {
          await pool.query(
            `INSERT INTO orden_analisis (
              id_orden, 
              codigo_practica, 
              estado, 
              fecha_creacion
            ) VALUES (?, ?, 'pendiente', NOW())`,
            [orden_id, codigo_practica]
          );
        }
      }

      console.log('✅ Análisis asociados creados:', analisis_solicitados.length);

      await pool.query('COMMIT');

      console.log('✅ Orden creada exitosamente:', nro_orden);

      return res.status(201).json({
        success: true,
        message: 'Orden creada exitosamente',
        orden: {
          id: orden_id,
          nro_orden: nro_orden,
          estado: 'pendiente',
          fecha_ingreso: new Date().toISOString(),
          urgente: urgente || false,
          total_analisis: analisis_solicitados.length,
          costo_total: costo_total
        }
      });

    } catch (transactionError) {
      await pool.query('ROLLBACK');
      throw transactionError;
    }

  } catch (error: any) {
    console.error('💥 ERROR AL CREAR ORDEN:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al crear la orden',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};