// src/controllers/orden.controller.ts

import { Request, Response } from 'express';
import { pool } from '../routes/db';

// ============================================
// HELPERS
// ============================================
const getStringParam = (param: any): string => {
  if (typeof param === 'string') return param.trim();
  if (Array.isArray(param) && param.length > 0) return String(param[0]).trim();
  return '';
};

const getNumberParam = (param: any, defaultValue: number): number => {
  if (typeof param === 'string') {
    const parsed = parseInt(param, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};

// ============================================
// 1. OBTENER CATÁLOGO
// ============================================
export const getCatalogo = async (req: Request, res: Response) => {
  try {
    const [rows]: [any[], any] = await pool.query('SELECT * FROM analisis');
    
    const catalogo = rows.map(row => ({
        id_analisis: row.id_analisis || row.codigo_practica,
        codigo: row.codigo_practica,
        nombre: row.descripcion_practica || row.nombre || "Sin nombre", 
        categoria: row.TIPO || row.categoria || "General",
        precio_estimado: row.HONORARIOS || row.precio || 0
    }));

    res.json({ success: true, data: catalogo });
  } catch (error: any) {
    console.error('💥 ERROR CATÁLOGO:', error.message);
    res.status(500).json({ success: false, message: 'Error al leer catálogo' });
  }
};

// ============================================
// 2. CREAR NUEVA ORDEN (ADMIN + MÉDICO)
// ============================================
export const crearNuevaOrden = async (req: Request, res: Response) => {
  const { 
    id_paciente, nro_ficha_paciente, 
    id_medico, 
    analisis, analisis_solicitados, 
    urgente, observaciones 
  } = req.body;

  const idPacienteFinal = id_paciente || nro_ficha_paciente;
  const listaAnalisis = analisis || analisis_solicitados;

  try {
    console.log('➕ CREANDO ORDEN | Paciente:', idPacienteFinal, '| Médico:', id_medico);

    if (!idPacienteFinal) return res.status(400).json({ success: false, message: 'Falta paciente' });
    if (!listaAnalisis?.length) return res.status(400).json({ success: false, message: 'Faltan análisis' });
    if (!id_medico) {
        return res.status(400).json({ success: false, message: 'El médico solicitante es obligatorio.' });
    }

    await pool.query('START TRANSACTION');

    const nro_orden = `ORD-${Date.now()}-${Math.floor(Math.random() * 100)}`;
    
    let costo_total = 0;
    try {
        const placeholders = listaAnalisis.map(() => '?').join(',');
        const [costos]: [any[], any] = await pool.query(
            `SELECT SUM(COALESCE(HONORARIOS, 0) + COALESCE(GASTOS, 0)) as total FROM analisis WHERE codigo_practica IN (${placeholders})`,
            listaAnalisis
        );
        costo_total = costos[0]?.total || 0;
    } catch (e) {}

    const [ordenResult]: [any, any] = await pool.query(
      `INSERT INTO orden (nro_orden, nro_ficha_paciente, id_medico_solicitante, fecha_ingreso_orden, estado, observaciones, urgente, costo_total, fecha_creacion)
       VALUES (?, ?, ?, NOW(), 'pendiente', ?, ?, ?, NOW())`,
      [nro_orden, idPacienteFinal, id_medico, observaciones || '', urgente ? 1 : 0, costo_total]
    );

    const id_orden = ordenResult.insertId;

    const values = listaAnalisis.map((codigo: any) => [id_orden, codigo, 'pendiente', new Date()]);
    await pool.query(
      `INSERT INTO orden_analisis (id_orden, codigo_practica, estado, fecha_creacion) VALUES ?`,
      [values]
    );

    await pool.query('COMMIT');
    console.log('✅ ÉXITO:', nro_orden);

    res.status(201).json({ success: true, message: 'Orden creada', orden: { id: id_orden, nro_orden } });

  } catch (error: any) {
    await pool.query('ROLLBACK');
    console.error('💥 ERROR CREANDO:', error);
    res.status(500).json({ success: false, message: error.sqlMessage || 'Error interno' });
  }
};

// ============================================
// 3. GETTERS Y UTILIDADES (MÉDICO)
// ============================================
export const getOrdenesMedico = async (req: Request, res: Response) => {
  const id_medico = parseInt(req.params.id_medico);
  const limite = getNumberParam(req.query.limite, 50);
  const offset = getNumberParam(req.query.offset, 0);
  const estado = getStringParam(req.query.estado);
  const urgente = req.query.urgente === 'true';
  const buscar = getStringParam(req.query.buscar);

  try {
    let query = `
        SELECT 
            o.*,
            p.nombre_paciente, p.apellido_paciente, p.dni, p.edad, p.mutual,
            COUNT(oa.id_orden_analisis) AS total_analisis,
            SUM(CASE WHEN oa.estado = 'finalizado' THEN 1 ELSE 0 END) AS analisis_finalizados
        FROM orden o
        LEFT JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
        LEFT JOIN orden_analisis oa ON o.id_orden = oa.id_orden
        WHERE o.id_medico_solicitante = ?
    `;
    const params: any[] = [id_medico];

    if (estado && estado !== 'todos') { query += ` AND o.estado = ?`; params.push(estado); }
    if (urgente) { query += ` AND o.urgente = 1`; }
    if (buscar) {
        query += ` AND (p.nombre_paciente LIKE ? OR p.apellido_paciente LIKE ? OR p.dni LIKE ? OR o.nro_orden LIKE ?)`;
        const searchPattern = `%${buscar}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ` GROUP BY o.id_orden ORDER BY o.fecha_ingreso_orden DESC LIMIT ? OFFSET ?`;
    params.push(limite, offset);

    const [rows]: [any[], any] = await pool.query(query, params);
    res.json({ success: true, ordenes: rows });
  } catch (e: any) { 
    res.status(500).json({ success: false, message: 'Error interno del servidor' }); 
  }
};

// ============================================
// 4. DETALLE DE ORDEN (BIOQUÍMICO)
// ============================================
export const getOrdenDetalle = async (req: Request, res: Response) => {
    const { id_orden } = req.params;
    try {
        const [ordenRows]: [any[], any] = await pool.query(`
            SELECT o.*, 
                   p.nombre_paciente, p.apellido_paciente, p.DNI, p.edad, p.sexo, p.mutual, p.nro_afiliado, p.nro_ficha,
                   m.nombre_medico, m.apellido_medico, m.id_medico,
                   b.Matricula_profesional as matricula_bq, b.Apellido_bq
            FROM orden o
            JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
            JOIN medico m ON o.id_medico_solicitante = m.id_medico
            LEFT JOIN bioquimico b ON o.matricula_bq_efectua = b.Matricula_profesional
            WHERE o.id_orden = ?
        `, [id_orden]);

        if (ordenRows.length === 0) return res.status(404).json({ success: false, message: 'Orden no encontrada' });

        const ordenData = ordenRows[0];

        const [analisisPadres]: [any[], any] = await pool.query(`
            SELECT oa.*, a.descripcion_practica, a.TIPO, a.HONORARIOS
            FROM orden_analisis oa
            JOIN analisis a ON oa.codigo_practica = a.codigo_practica
            WHERE oa.id_orden = ?
        `, [id_orden]);

        const analisisCompleto = await Promise.all(analisisPadres.map(async (padre: any) => {
            const [hijos]: [any[], any] = await pool.query(`
                SELECT 
                    i.codigo_hijo as codigo_practica,
                    a.descripcion_practica, a.UNIDAD_BIOQUIMICA as unidad, a.REFERENCIA as valor_referencia,
                    oa.valor_hallado, oa.unidad_hallada, oa.estado, oa.interpretacion, oa.observaciones,
                    oa.tecnico_responsable as tecnico, oa.fecha_realizacion, a.HONORARIOS
                FROM incluye i
                JOIN analisis a ON i.codigo_hijo = a.codigo_practica
                LEFT JOIN orden_analisis oa ON oa.id_orden = ? AND oa.codigo_practica = i.codigo_hijo
                WHERE i.codigo_padre = ?
            `, [id_orden, padre.codigo_practica]);

            return {
                id: padre.id_orden_analisis,
                codigo: padre.codigo_practica,               
                descripcion: padre.descripcion_practica,     
                tipo: padre.TIPO,
                estado: padre.estado,
                fecha_realizacion: padre.fecha_realizacion,
                valor_hallado: padre.valor_hallado,
                unidad: padre.unidad_hallada,
                valor_referencia: padre.valor_referencia_aplicado,
                interpretacion: padre.interpretacion,
                tecnico: padre.tecnico_responsable,
                observaciones: padre.observaciones,
                honorarios: Number(padre.HONORARIOS) || 0,   
                
                sub_analisis: hijos.length > 0 ? hijos.map((h: any) => ({
                    id: `child-${h.codigo_practica}`,
                    codigo: h.codigo_practica,
                    descripcion: h.descripcion_practica,
                    tipo: 'Sub-análisis',
                    estado: h.estado || (padre.estado === 'finalizado' ? 'finalizado' : 'pendiente'),
                    valor_hallado: h.valor_hallado,
                    unidad: h.unidad_hallada || h.unidad,
                    valor_referencia: h.valor_referencia,
                    interpretacion: h.interpretacion,
                    tecnico: h.tecnico,
                    observaciones: h.observaciones,
                    honorarios: 0, 
                    es_subanalisis: true
                })) : []
            };
        }));
        
        res.json({ 
            success: true, 
            orden: {
                ...ordenData,
                nombre: ordenData.nombre_paciente,
                apellido: ordenData.apellido_paciente,
                dni: ordenData.DNI,
                matricula_bioquimico: ordenData.matricula_bq || "Pendiente"
            }, 
            analisis: analisisCompleto 
        });

    } catch(e: any) { 
        res.status(500).json({ success: false, message: 'Error interno del servidor' }); 
    }
};

// ============================================
// 5. FINALIZAR ORDEN MANUALMENTE
// ============================================
export const finalizarOrden = async (req: Request, res: Response) => {
    const { id_orden } = req.params;
    try {
        await pool.query('START TRANSACTION');
        await pool.query(`UPDATE orden_analisis SET estado = 'finalizado' WHERE id_orden = ?`, [id_orden]);
        await pool.query(`UPDATE orden SET estado = 'finalizado' WHERE id_orden = ?`, [id_orden]);
        await pool.query('COMMIT');
        res.json({ success: true, message: 'Orden finalizada correctamente' });
    } catch (error: any) {
        await pool.query('ROLLBACK');
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

// ============================================
// 6. LISTADO BIOQUÍMICO (CON AUTO-CORRECTOR 🔥)
// ============================================
export const getOrdenesPendientes = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT 
                o.id_orden, o.nro_orden, o.fecha_ingreso_orden, o.urgente,
                p.nombre_paciente, p.apellido_paciente, p.dni, p.edad, p.mutual,
                m.nombre_medico, m.apellido_medico,
                COUNT(oa.id_orden_analisis) as total_analisis,
                SUM(CASE WHEN oa.estado = 'finalizado' THEN 1 ELSE 0 END) as analisis_listos,
                
                -- 🔥 AUTO-CORRECCIÓN MÁGICA: 
                -- Si la orden tiene 100% de progreso, le decimos al frontend que es 'finalizada'
                -- sin importar lo que diga realmente la tabla 'orden' histórica.
                CASE 
                    WHEN COUNT(oa.id_orden_analisis) > 0 
                         AND COUNT(oa.id_orden_analisis) = SUM(CASE WHEN oa.estado = 'finalizado' THEN 1 ELSE 0 END) 
                    THEN 'finalizado' 
                    ELSE o.estado 
                END as estado
                
            FROM orden o
            JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
            JOIN medico m ON o.id_medico_solicitante = m.id_medico
            LEFT JOIN orden_analisis oa ON o.id_orden = oa.id_orden
            
            GROUP BY o.id_orden, o.nro_orden, o.fecha_ingreso_orden, o.estado, o.urgente, 
                     p.nombre_paciente, p.apellido_paciente, p.dni, p.edad, p.mutual, 
                     m.nombre_medico, m.apellido_medico
            ORDER BY o.fecha_ingreso_orden DESC
        `;

        const [rows]: [any[], any] = await pool.query(query);
        res.json({ success: true, ordenes: rows });

    } catch (error: any) {
        console.error('❌ Error al obtener órdenes pendientes:', error.message);
        res.status(500).json({ success: false, message: 'Error de servidor' });
    }
};

// ============================================
// 7. GUARDAR RESULTADO INDIVIDUAL
// ============================================
export const guardarResultadoAnalisis = async (req: Request, res: Response) => {
    const { id_orden, codigo_practica } = req.params;
    const { valor_hallado, unidad, observaciones } = req.body;

    try {
        await pool.query(`
            UPDATE orden_analisis 
            SET valor_hallado = ?, 
                unidad_hallada = ?, 
                observaciones = ?, 
                estado = 'finalizado', 
                fecha_realizacion = NOW()
            WHERE id_orden = ? AND codigo_practica = ?
        `, [valor_hallado, unidad, observaciones, id_orden, codigo_practica]);

        res.json({ success: true, message: 'Resultado guardado correctamente' });
    } catch (error: any) {
        console.error('❌ Error al guardar resultado:', error.message);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
};

export default { 
    getCatalogo, 
    crearNuevaOrden, 
    getOrdenesMedico, 
    getOrdenesPendientes, 
    getOrdenDetalle,
    finalizarOrden,
    guardarResultadoAnalisis
};