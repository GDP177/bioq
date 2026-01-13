// src/controllers/analisis.controller.ts - VERSIÓN CORREGIDA CON NOMBRES CORRECTOS

import { Request, Response } from 'express';
import { pool } from '../routes/db';

// ============================================
// FUNCIÓN PARA MANEJAR QUERY PARAMS (Existente)
// ============================================
const getStringParam = (param: any): string => {
  if (typeof param === 'string') return param.trim();
  if (Array.isArray(param) && param.length > 0) return String(param[0]).trim();
  return '';
};
// ============================================
// [NUEVO] LISTAR TODOS LOS ANÁLISIS (ADMIN) - CORREGIDO
// ============================================
export const getAllAnalisisAdmin = async (req: Request, res: Response) => {
  try {
    // ✅ Query simplificada con columnas confirmadas en image_389d6c.png
    const [rows]: any = await pool.query(`
      SELECT 
        codigo_practica, 
        descripcion_practica, 
        TIPO, 
        URGENCIA,
        HONORARIOS
      FROM analisis 
      ORDER BY descripcion_practica ASC
    `);

    return res.status(200).json({
      success: true,
      data: rows // Enviamos la propiedad 'data' que el frontend espera
    });
  } catch (error: any) {
    console.error("💥 Error SQL en getAllAnalisisAdmin:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// [NUEVO] CREAR O EDITAR ANÁLISIS (CON RECURSIVIDAD)
// ============================================
export const guardarAnalisis = async (req: Request, res: Response) => {
  const { 
    codigo_practica, 
    descripcion_practica, 
    referencia, 
    unidad_bioquimica, 
    codigo_modulo,
    urgencia,
    hijos 
  } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    console.log(`💾 Guardando análisis: ${codigo_practica} - ${descripcion_practica}`);

    await connection.query(`
      INSERT INTO analisis (
        codigo_practica, descripcion_practica, REFERENCIA, 
        UNIDAD_BIOQUIMICA, codigo_modulo, URGENCIA
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        descripcion_practica = VALUES(descripcion_practica),
        REFERENCIA = VALUES(REFERENCIA),
        UNIDAD_BIOQUIMICA = VALUES(UNIDAD_BIOQUIMICA),
        codigo_modulo = VALUES(codigo_modulo),
        URGENCIA = VALUES(URGENCIA)
    `, [codigo_practica, descripcion_practica.toUpperCase(), referencia, unidad_bioquimica, codigo_modulo || 1, urgencia || 'N']);

    await connection.query("DELETE FROM incluye WHERE codigo_padre = ?", [codigo_practica]);

    if (hijos && hijos.length > 0) {
      const values = hijos.map((hijoCod: any) => [
        codigo_practica, 
        hijoCod, 
        `Componente de ${descripcion_practica.toUpperCase()}`
      ]);
      await connection.query(
        "INSERT INTO incluye (codigo_padre, codigo_hijo, descripcion) VALUES ?", 
        [values]
      );
    }

    await connection.commit();
    console.log('✅ Análisis y relaciones guardadas con éxito');
    res.status(200).json({ success: true, message: "Práctica guardada correctamente" });
  } catch (error: any) {
    await connection.rollback();
    console.error("💥 Error al guardar análisis:", error);
    res.status(500).json({ success: false, message: "Error interno al procesar guardado" });
  } finally {
    connection.release();
  }
};

// ============================================
// OBTENER ANÁLISIS DEL MÉDICO - MANTENIDO Y ASEGURADO
// ============================================
export const getAnalisisMedico = async (req: Request, res: Response) => {
  const id_medico = parseInt(req.params.id_medico);
  const estado = getStringParam(req.query.estado) || 'todos';
  const tipo = getStringParam(req.query.tipo) || 'todos';
  const buscar = getStringParam(req.query.buscar);
  const fecha_desde = getStringParam(req.query.fecha_desde);
  const fecha_hasta = getStringParam(req.query.fecha_hasta);

  try {
    console.log('🧪 Buscando análisis para Médico ID:', id_medico);

    if (!id_medico || id_medico <= 0) {
      return res.status(400).json({ success: false, message: 'ID de médico inválido' });
    }

    let whereConditions = ['o.id_medico_solicitante = ?'];
    let queryParams: any[] = [id_medico];

    if (estado && estado !== 'todos') {
      whereConditions.push('oa.estado = ?');
      queryParams.push(estado);
    }

    if (tipo && tipo !== 'todos') {
      whereConditions.push('a.TIPO = ?');
      queryParams.push(tipo);
    }

    if (buscar && buscar.length > 0) {
      const searchTerm = `%${buscar}%`;
      whereConditions.push(`(a.descripcion_practica LIKE ? OR p.Nombre_paciente LIKE ? OR p.Apellido_paciente LIKE ? OR p.DNI LIKE ?)`);
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (fecha_desde) {
      whereConditions.push('DATE(o.fecha_ingreso_orden) >= ?');
      queryParams.push(fecha_desde);
    }

    if (fecha_hasta) {
      whereConditions.push('DATE(o.fecha_ingreso_orden) <= ?');
      queryParams.push(fecha_hasta);
    }

    const whereClause = whereConditions.join(' AND ');

    const mainQuery = `
      SELECT 
        oa.id_orden_analisis, oa.codigo_practica, oa.estado as analisis_estado,
        oa.fecha_realizacion, oa.valor_hallado, oa.unidad_hallada,
        oa.observaciones as analisis_observaciones,
        COALESCE(a.descripcion_practica, 'Análisis no especificado') as descripcion_practica,
        COALESCE(a.TIPO, 'General') as tipo,
        o.id_orden, o.nro_orden, o.fecha_ingreso_orden,
        COALESCE(o.urgente, 0) as urgente,
        p.Nombre_paciente as nombre_paciente, p.Apellido_paciente as apellido_paciente,
        p.DNI as dni, p.edad
      FROM orden_analisis oa
      JOIN orden o ON oa.id_orden = o.id_orden
      JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
      LEFT JOIN analisis a ON oa.codigo_practica = a.codigo_practica
      WHERE ${whereClause}
      ORDER BY o.fecha_ingreso_orden DESC
      LIMIT 500
    `;

    const [analisisRows]: [any[], any] = await pool.query(mainQuery, queryParams);

    const analisisFormateados = analisisRows.map((item: any) => ({
        id: item.id_orden_analisis,
        codigo_practica: item.codigo_practica,
        descripcion: item.descripcion_practica,
        tipo: item.tipo,
        estado: item.analisis_estado,
        fecha_realizacion: item.fecha_realizacion,
        valor_hallado: item.valor_hallado,
        unidad_hallada: item.unidad_hallada,
        observaciones: item.analisis_observaciones,
        orden: {
          id: item.id_orden,
          nro_orden: item.nro_orden,
          fecha_ingreso: item.fecha_ingreso_orden,
          urgente: item.urgente === 1,
          paciente: {
            nombre: item.nombre_paciente,
            apellido: item.apellido_paciente,
            dni: item.dni,
            edad: item.edad
          }
        }
    }));

    return res.status(200).json({
      success: true,
      analisis: analisisFormateados,
      total: analisisRows.length
    });

  } catch (error: any) {
    console.error('💥 Error en getAnalisisMedico:', error.message);
    return res.status(500).json({ success: false, message: 'Error al obtener análisis' });
  }
};

// ============================================
// OBTENER TIPOS DE ANÁLISIS
// ============================================


// En el controlador de análisis del backend
export const actualizarReferenciaCatalogo = async (req: Request, res: Response) => {
    const { codigo_practica } = req.params;
    const { REFERENCIA } = req.body;

    try {
        // Actualizamos el valor maestro en la tabla 'analisis'
        await pool.query(
            "UPDATE analisis SET REFERENCIA = ? WHERE codigo_practica = ?",
            [REFERENCIA, codigo_practica]
        );
        return res.json({ success: true, message: 'Catálogo actualizado' });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};


export const getTiposAnalisis = async (req: Request, res: Response) => {
  try {
    const [tiposRows]: [any[], any] = await pool.query(
      `SELECT DISTINCT TIPO as tipo, COUNT(*) as cantidad
       FROM analisis 
       WHERE TIPO IS NOT NULL AND TIPO != ''
       GROUP BY TIPO
       ORDER BY cantidad DESC`
    );

    return res.status(200).json({
      success: true,
      tipos: tiposRows
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al obtener tipos' });
  }
};

// ============================================
// OBTENER ANÁLISIS DISPONIBLES (Para el selector de Nueva Solicitud)
// ============================================
export const getAnalisisDisponibles = async (req: Request, res: Response) => {
  try {
    console.log('📋 Buscando análisis disponibles para solicitudes...');
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

    return res.status(200).json({
      success: true,
      analisis: analisisRows
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al obtener análisis disponibles' });
  }
};

// ============================================
// ESTRUCTURA DE COMPONENTES
// ============================================
export const getEstructuraAnalisis = async (req: Request, res: Response) => {
  const { codigo } = req.params;
  try {
    const [hijos]: any = await pool.query(`
      SELECT i.codigo_hijo, a.descripcion_practica, a.REFERENCIA, a.UNIDAD_BIOQUIMICA 
      FROM incluye i
      JOIN analisis a ON i.codigo_hijo = a.codigo_practica
      WHERE i.codigo_padre = ?
    `, [codigo]);

    res.json({ success: true, data: hijos });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al obtener componentes" });
  }
};