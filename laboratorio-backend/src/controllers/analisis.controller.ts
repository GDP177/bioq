// src/controllers/analisis.controller.ts

import { Request, Response } from 'express';
import { pool } from '../routes/db'; 

// ============================================
// 1. FUNCIONES AUXILIARES
// ============================================

const getStringParam = (param: any): string => {
  if (typeof param === 'string') return param.trim();
  if (Array.isArray(param) && param.length > 0) return String(param[0]).trim();
  return '';
};

// ============================================
// 2. FUNCIONES DE ADMINISTRADOR (GESTIÓN DE CATÁLOGO)
// ============================================

// Listar todos los análisis para el Dashboard de Admin
export const getAllAnalisisAdmin = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT 
        a.codigo_practica, 
        a.descripcion_practica, 
        a.REFERENCIA,
        a.UNIDAD_BIOQUIMICA,
        a.TIPO, 
        a.URGENCIA,
        a.HONORARIOS,
        -- Contamos si es padre (tiene hijos en tabla incluye)
        (SELECT COUNT(*) FROM incluye WHERE codigo_padre = a.codigo_practica) as cantidad_hijos,
        -- Vemos si es hijo (tiene un padre en tabla incluye)
        (SELECT codigo_padre FROM incluye WHERE codigo_hijo = a.codigo_practica LIMIT 1) as codigo_padre
      FROM analisis a
      ORDER BY a.descripcion_practica ASC
    `);

    return res.status(200).json({ success: true, data: rows });
  } catch (error: any) {
    console.error("Error getAllAnalisisAdmin:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Crear o Editar Análisis (Con soporte para Jerarquía/Hijos)
export const guardarAnalisis = async (req: Request, res: Response) => {
  const { 
    codigo_practica, descripcion_practica, referencia, 
    unidad_bioquimica, codigo_modulo, urgencia, hijos 
  } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Insertar o Actualizar Análisis (Tabla Principal)
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

    // 2. Gestionar Jerarquía (Tabla 'incluye')
    
    // Primero: Eliminamos relaciones anteriores donde este análisis sea padre
    await connection.query("DELETE FROM incluye WHERE codigo_padre = ?", [codigo_practica]);

    // Segundo: Insertamos los nuevos hijos si existen
    if (hijos && Array.isArray(hijos) && hijos.length > 0) {
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
    res.status(200).json({ success: true, message: "Análisis guardado correctamente" });

  } catch (error: any) {
    await connection.rollback();
    console.error("Error al guardar análisis:", error);
    res.status(500).json({ success: false, message: "Error al procesar la solicitud" });
  } finally {
    connection.release();
  }
};

// Actualizar solo el Valor de Referencia (Edición Rápida)
export const actualizarReferenciaCatalogo = async (req: Request, res: Response) => {
    const { codigo_practica } = req.params;
    const { REFERENCIA } = req.body;

    try {
        await pool.query(
            "UPDATE analisis SET REFERENCIA = ? WHERE codigo_practica = ?",
            [REFERENCIA, codigo_practica]
        );
        return res.json({ success: true, message: 'Referencia actualizada' });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// Obtener estructura de componentes (Hijos de un análisis - Uso interno)
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

// ============================================
// 3. FUNCIONES DE MÉDICO (CONSULTAS)
// ============================================

export const getAnalisisMedico = async (req: Request, res: Response) => {
  const id_medico = parseInt(req.params.id_medico);
  const estado = getStringParam(req.query.estado) || 'todos';
  const tipo = getStringParam(req.query.tipo) || 'todos';
  const buscar = getStringParam(req.query.buscar);
  const fecha_desde = getStringParam(req.query.fecha_desde);
  const fecha_hasta = getStringParam(req.query.fecha_hasta);

  try {
    if (!id_medico || id_medico <= 0) return res.status(400).json({ success: false, message: 'ID Médico inválido' });

    let whereConditions = ['o.id_medico_solicitante = ?'];
    let queryParams: any[] = [id_medico];

    if (estado !== 'todos') { whereConditions.push('oa.estado = ?'); queryParams.push(estado); }
    if (tipo !== 'todos') { whereConditions.push('a.TIPO = ?'); queryParams.push(tipo); }
    
    if (buscar) {
      const term = `%${buscar}%`;
      whereConditions.push(`(a.descripcion_practica LIKE ? OR p.Nombre_paciente LIKE ? OR p.Apellido_paciente LIKE ? OR p.DNI LIKE ?)`);
      queryParams.push(term, term, term, term);
    }

    if (fecha_desde) { whereConditions.push('DATE(o.fecha_ingreso_orden) >= ?'); queryParams.push(fecha_desde); }
    if (fecha_hasta) { whereConditions.push('DATE(o.fecha_ingreso_orden) <= ?'); queryParams.push(fecha_hasta); }

    const whereClause = whereConditions.join(' AND ');

    const [analisisRows]: [any[], any] = await pool.query(`
      SELECT 
        oa.id_orden_analisis, oa.codigo_practica, oa.estado as analisis_estado,
        oa.fecha_realizacion, oa.valor_hallado, oa.unidad_hallada,
        oa.observaciones as analisis_observaciones,
        COALESCE(a.descripcion_practica, 'Análisis no especificado') as descripcion_practica,
        COALESCE(a.TIPO, 'General') as tipo,
        o.id_orden, o.nro_orden, o.fecha_ingreso_orden,
        COALESCE(o.urgente, 0) as urgente,
        p.Nombre_paciente, p.Apellido_paciente, p.DNI, p.edad
      FROM orden_analisis oa
      JOIN orden o ON oa.id_orden = o.id_orden
      JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
      LEFT JOIN analisis a ON oa.codigo_practica = a.codigo_practica
      WHERE ${whereClause}
      ORDER BY o.fecha_ingreso_orden DESC
      LIMIT 500
    `, queryParams);

    const formatted = analisisRows.map((item: any) => ({
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
            nombre: item.Nombre_paciente,
            apellido: item.Apellido_paciente,
            dni: item.DNI,
            edad: item.edad
          }
        }
    }));

    return res.status(200).json({ success: true, analisis: formatted, total: analisisRows.length });

  } catch (error: any) {
    console.error('Error getAnalisisMedico:', error.message);
    return res.status(500).json({ success: false, message: 'Error al obtener análisis' });
  }
};

// ============================================
// 4. FUNCIONES COMPARTIDAS / UTILIDADES
// ============================================

export const getTiposAnalisis = async (req: Request, res: Response) => {
  try {
    const [rows]: [any[], any] = await pool.query(
      `SELECT DISTINCT TIPO as tipo, COUNT(*) as cantidad
       FROM analisis 
       WHERE TIPO IS NOT NULL AND TIPO != ''
       GROUP BY TIPO ORDER BY cantidad DESC`
    );
    return res.status(200).json({ success: true, tipos: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al obtener tipos' });
  }
};

export const getAnalisisDisponibles = async (req: Request, res: Response) => {
  try {
    const [rows]: [any[], any] = await pool.query(
      `SELECT 
        codigo_practica as codigo,
        descripcion_practica as descripcion,
        TIPO as tipo,
        HONORARIOS as precio
       FROM analisis 
       WHERE descripcion_practica IS NOT NULL
       ORDER BY descripcion_practica ASC`
    );
    return res.status(200).json({ success: true, analisis: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al obtener análisis disponibles' });
  }
};

// ============================================
// 5. SELECTOR DE ANÁLISIS (Para Nueva Orden - Frontend)
// ============================================

// ✅ Obtiene el catálogo formateado para el componente <AnalysisSelector />
export const getCatalogoAnalisis = async (req: Request, res: Response) => {
    try {
        // Usamos alias (AS) para que el Frontend reciba: id_analisis, nombre, codigo
        const query = `
            SELECT 
                codigo_practica as id_analisis, 
                descripcion_practica as nombre, 
                codigo_practica as codigo, 
                descripcion_modulo as categoria 
            FROM analisis
            LIMIT 2000
        `;
        const [rows] = await pool.query(query);
        res.json({ success: true, analisis: rows });
    } catch (error) { 
        console.error('❌ Error obteniendo análisis:', error);
        res.status(500).json({ success: false }); 
    }
};

// ✅ Obtiene los hijos de un análisis (si es un paquete)
export const getHijosAnalisis = async (req: Request, res: Response) => {
    const { codigo } = req.params;
    try {
        const query = `
            SELECT 
                a.codigo_practica as id_analisis,
                a.descripcion_practica as nombre,
                a.codigo_practica as codigo
            FROM incluye i
            JOIN analisis a ON i.codigo_hijo = a.codigo_practica
            WHERE i.codigo_padre = ?
        `;
        const [rows]: any = await pool.query(query, [codigo]);
        res.json({ success: true, hijos: rows });
    } catch (error) {
        console.error("Error buscando hijos:", error);
        res.status(500).json({ success: false, hijos: [] });
    }
};

// Exportar objeto por defecto
export default {
    getAllAnalisisAdmin,
    guardarAnalisis,
    getAnalisisMedico,
    getTiposAnalisis,
    getAnalisisDisponibles,
    actualizarReferenciaCatalogo,
    getEstructuraAnalisis,
    // Nuevas funciones exportadas
    getCatalogoAnalisis,
    getHijosAnalisis
};