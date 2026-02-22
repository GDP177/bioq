// laboratorio-backend/src/controllers/bioquimico.controller.ts

import { Request, Response } from 'express';
import { pool } from '../routes/db';

// ==========================================
// 1. PERFIL BIOQUÍMICO
// ==========================================
export const completarPerfilBioquimico = async (req: Request, res: Response) => {
  const { 
    id_usuario, nombre_bq, apellido_bq, dni_bioquimico, matricula_profesional,
    telefono, direccion, fecha_habilitacion, fecha_vencimiento_matricula
  } = req.body;

  try {
    if (!id_usuario || !nombre_bq || !apellido_bq || !dni_bioquimico || !matricula_profesional) {
      return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' });
    }

    const [userRows]: any = await pool.query('SELECT email FROM usuarios WHERE id_usuario = ?', [id_usuario]);
    if (userRows.length === 0) return res.status(404).json({ success: false, message: 'Usuario base no encontrado' });
    const userEmail = userRows[0].email;

    const [existing]: any = await pool.query('SELECT matricula_profesional FROM bioquimico WHERE id_usuario = ?', [id_usuario]);
    
    if (existing.length > 0) {
       const [duplicados]: any = await pool.query(
           `SELECT matricula_profesional, dni_bioquimico, email FROM bioquimico 
            WHERE (dni_bioquimico = ? OR matricula_profesional = ? OR email = ?) 
            AND id_usuario != ?`,
           [dni_bioquimico, matricula_profesional, userEmail, id_usuario]
       );

       if (duplicados.length > 0) {
           let msg = 'Conflicto de datos: ';
           if (duplicados.some((d:any) => d.dni_bioquimico == dni_bioquimico)) msg += 'DNI ya registrado. ';
           if (duplicados.some((d:any) => d.matricula_profesional == matricula_profesional)) msg += 'Matrícula ya registrada. ';
           if (duplicados.some((d:any) => d.email == userEmail)) msg += 'Email ya asociado a otro bioquímico.';
           return res.status(409).json({ success: false, message: msg.trim() });
       }

       await pool.query(
         `UPDATE bioquimico SET 
            nombre_bq = ?, apellido_bq = ?, dni_bioquimico = ?, matricula_profesional = ?, 
            telefono = ?, direccion = ?, fecha_habilitacion = ?, fecha_vencimiento_matricula = ?,
            activo = 1, fecha_modificacion = NOW()
          WHERE id_usuario = ?`,
         [nombre_bq, apellido_bq, dni_bioquimico, matricula_profesional, telefono, direccion, fecha_habilitacion, fecha_vencimiento_matricula, id_usuario]
       );

       return res.status(200).json({ success: true, message: 'Perfil actualizado exitosamente' });

    } else {
       const [duplicados]: any = await pool.query(
           `SELECT matricula_profesional, dni_bioquimico, email FROM bioquimico 
            WHERE dni_bioquimico = ? OR matricula_profesional = ? OR email = ?`,
           [dni_bioquimico, matricula_profesional, userEmail]
       );

       if (duplicados.length > 0) {
             let msg = 'No se puede crear: ';
             if (duplicados.some((d:any) => d.dni_bioquimico == dni_bioquimico)) msg += 'DNI ya registrado. ';
             if (duplicados.some((d:any) => d.matricula_profesional == matricula_profesional)) msg += 'Matrícula ya registrada. ';
             if (duplicados.some((d:any) => d.email == userEmail)) msg += 'Email ya en uso por otro profesional.';
             return res.status(409).json({ success: false, message: msg.trim() });
       }

       await pool.query(
         `INSERT INTO bioquimico (
             id_usuario, nombre_bq, apellido_bq, dni_bioquimico, matricula_profesional, 
             telefono, direccion, email, activo, fecha_creacion, fecha_habilitacion, fecha_vencimiento_matricula
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), ?, ?)`,
         [id_usuario, nombre_bq, apellido_bq, dni_bioquimico, matricula_profesional, telefono, direccion, userEmail, fecha_habilitacion, fecha_vencimiento_matricula]
       );

       return res.status(201).json({ success: true, message: 'Perfil creado exitosamente' });
    }

  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. DASHBOARD (SÚPER BLINDADO 🚀)
// ==========================================
export const getDashboardBioquimico = async (req: Request, res: Response) => {
  const matricula = req.params.matricula_profesional;
  try {
    const [bq]: any = await pool.query('SELECT * FROM bioquimico WHERE matricula_profesional = ?', [matricula]);
    if (bq.length === 0) return res.status(404).json({ success: false, message: 'Bioquímico no encontrado' });

    // 🔥 MAGIA MATEMÁTICA: Ahora calculamos la realidad contando los análisis internos de cada orden
    const [stats]: any = await pool.query(`
      SELECT 
        (
            SELECT COUNT(*) FROM (
                SELECT o.id_orden, 
                       (SELECT COUNT(*) FROM orden_analisis WHERE id_orden = o.id_orden) as total,
                       (SELECT COUNT(*) FROM orden_analisis WHERE id_orden = o.id_orden AND estado = 'finalizado') as listos
                FROM orden o
            ) as t WHERE t.total > 0 AND t.listos = 0
        ) as ordenes_pendientes,
        (
            SELECT COUNT(*) FROM (
                SELECT o.id_orden, 
                       (SELECT COUNT(*) FROM orden_analisis WHERE id_orden = o.id_orden) as total,
                       (SELECT COUNT(*) FROM orden_analisis WHERE id_orden = o.id_orden AND estado = 'finalizado') as listos
                FROM orden o
            ) as t WHERE t.total > 0 AND t.listos > 0 AND t.listos < t.total
        ) as ordenes_proceso,
        (
            SELECT COUNT(*) FROM (
                SELECT o.id_orden, o.fecha_ingreso_orden,
                       (SELECT COUNT(*) FROM orden_analisis WHERE id_orden = o.id_orden) as total,
                       (SELECT COUNT(*) FROM orden_analisis WHERE id_orden = o.id_orden AND estado = 'finalizado') as listos
                FROM orden o
            ) as t 
            WHERE t.total > 0 AND t.listos = t.total
            AND (
                DATE(t.fecha_ingreso_orden) = CURDATE() OR 
                t.id_orden IN (SELECT id_orden FROM orden_analisis WHERE DATE(fecha_realizacion) = CURDATE())
            )
        ) as ordenes_completadas
    `);

    // 🔥 FILTRO ESTRICTO DE URGENCIAS: Solo mostramos las que NO están al 100% listas
    const [ordenes]: any = await pool.query(`
      SELECT * FROM (
          SELECT o.id_orden, o.nro_orden, o.fecha_ingreso_orden, o.estado, o.urgente,
                 p.Nombre_paciente, p.Apellido_paciente, p.DNI,
                 (SELECT COUNT(*) FROM orden_analisis WHERE id_orden = o.id_orden) as total_analisis,
                 (SELECT COUNT(*) FROM orden_analisis WHERE id_orden = o.id_orden AND estado = 'finalizado') as analisis_listos
          FROM orden o
          JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
      ) as subq
      WHERE subq.total_analisis > subq.analisis_listos
      ORDER BY subq.urgente DESC, subq.fecha_ingreso_orden ASC 
      LIMIT 5
    `);

    const [staff]: any = await pool.query(`
      SELECT 
        u.id_usuario, u.username, u.email, u.rol,
        COALESCE(m.nombre_medico, b.nombre_bq, u.username) as nombre,
        COALESCE(m.apellido_medico, b.apellido_bq, '') as apellido,
        COALESCE(m.matricula_medica, b.matricula_profesional, '') as matricula
      FROM usuarios u
      LEFT JOIN medico m ON u.email = m.email
      LEFT JOIN bioquimico b ON u.email = b.email
      WHERE u.rol IN ('medico', 'bioquimico') AND u.activo = 1
      ORDER BY u.rol ASC, apellido ASC
    `);

    res.json({
      success: true,
      bioquimico: bq[0],
      estadisticas: stats[0],
      ordenes_pendientes: ordenes.map((o: any) => ({
        id: o.id_orden,
        nro_orden: o.nro_orden,
        fecha_ingreso: o.fecha_ingreso_orden,
        estado: o.estado,
        urgente: o.urgente === 1,
        total_analisis: o.total_analisis,
        paciente: { nombre: o.Nombre_paciente, apellido: o.Apellido_paciente, dni: o.DNI }
      })),
      staff: staff,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("💥 ERROR DASHBOARD:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. ÓRDENES ENTRANTES (LISTA COMPLETA)
// ==========================================
export const getOrdenesEntrantes = async (req: Request, res: Response) => {
    try {
        const { buscar } = req.query; 
        
        let whereBusqueda = ""; 
        const params: any[] = [];

        if (buscar) {
            whereBusqueda = ` AND (
                p.Nombre_paciente LIKE ? OR 
                p.Apellido_paciente LIKE ? OR 
                p.DNI LIKE ? OR 
                o.nro_orden LIKE ?
            )`;
            const term = `%${buscar}%`;
            params.push(term, term, term, term);
        }
        
        const query = `
            SELECT 
                o.id_orden, 
                MAX(o.nro_orden) as nro_orden, 
                MAX(o.fecha_ingreso_orden) as fecha_ingreso_orden, 
                MAX(o.estado) as estado_original, 
                MAX(o.urgente) as urgente,
                MAX(p.Nombre_paciente) as nombre_paciente, 
                MAX(p.Apellido_paciente) as apellido_paciente, 
                MAX(p.DNI) as dni, 
                MAX(p.edad) as edad,
                MAX(p.mutual) as mutual,
                MAX(m.nombre_medico) as nombre_medico,
                MAX(m.apellido_medico) as apellido_medico,
                (SELECT COUNT(*) FROM orden_analisis WHERE id_orden = o.id_orden) as total_analisis,
                (SELECT COUNT(*) FROM orden_analisis WHERE id_orden = o.id_orden AND (estado = 'finalizado' OR estado = '1')) as analisis_listos
            FROM orden o
            LEFT JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
            LEFT JOIN medico m ON o.id_medico_solicitante = m.id_medico
            WHERE 1=1 ${whereBusqueda}
            GROUP BY o.id_orden
            ORDER BY MAX(o.urgente) DESC, MAX(o.fecha_ingreso_orden) DESC
        `;
        
        const [rows]: any = await pool.query(query, params);

        const ordenesProcesadas = rows.map((r: any) => {
            const total = Number(r.total_analisis) || 0;
            const listos = Number(r.analisis_listos) || 0;
            
            let estadoCalculado = 'pendiente';
            
            if (total > 0 && total === listos) {
                estadoCalculado = 'finalizado';
            } else if (listos > 0) {
                estadoCalculado = 'en_proceso';
            }

            return {
                id_orden: r.id_orden,
                nro_orden: r.nro_orden,
                fecha_ingreso_orden: r.fecha_ingreso_orden,
                estado: estadoCalculado, 
                urgente: r.urgente,
                nombre_paciente: r.nombre_paciente,
                apellido_paciente: r.apellido_paciente,
                dni: r.dni,
                edad: r.edad,
                mutual: r.mutual,
                nombre_medico: r.nombre_medico,
                apellido_medico: r.apellido_medico,
                total_analisis: total,
                analisis_listos: listos
            };
        });

        return res.json({ success: true, ordenes: ordenesProcesadas });
    } catch (error: any) {
        console.error("💥 Error en getOrdenesEntrantes:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

// ==========================================
// 4. DETALLE Y PROCESAMIENTO
// ==========================================
export const getDetalleOrden = async (req: Request, res: Response) => {
  const { id_orden } = req.params;
  try {
    const [ordenRows]: any = await pool.query(`
      SELECT o.*, p.Nombre_paciente, p.Apellido_paciente, p.DNI, p.edad, p.mutual, p.sexo
      FROM orden o JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha WHERE o.id_orden = ?`, 
      [id_orden]
    );

    if (ordenRows.length === 0) return res.status(404).json({ success: false, message: 'Orden no encontrada' });

    const [analisisRows]: any = await pool.query(`
      SELECT oa.*, a.descripcion_practica, a.unidad_bioquimica, a.REFERENCIA, a.valor_referencia_rango
      FROM orden_analisis oa LEFT JOIN analisis a ON oa.codigo_practica = a.codigo_practica WHERE oa.id_orden = ?`, 
      [id_orden]
    );

    res.json({
      success: true,
      orden: {
        id: ordenRows[0].id_orden,
        nro_orden: ordenRows[0].nro_orden,
        fecha_ingreso: ordenRows[0].fecha_ingreso_orden,
        estado: ordenRows[0].estado,
        urgente: ordenRows[0].urgente === 1,
        paciente: {
          nombre: ordenRows[0].Nombre_paciente,
          apellido: ordenRows[0].Apellido_paciente,
          dni: ordenRows[0].DNI,
          edad: ordenRows[0].edad,
          mutual: ordenRows[0].mutual,
          sexo: ordenRows[0].sexo
        },
        analisis: analisisRows.map((a: any, index: number) => ({
          id: a.id_orden_analisis || `temp_${index}`,
          codigo: a.codigo_practica,
          descripcion: a.descripcion_practica || `Análisis ${a.codigo_practica}`,
          estado: a.estado || 'pendiente',
          resultado: a.valor_hallado || "",
          unidad: a.unidad_hallada || a.unidad_bioquimica || "",
          referencia: a.valor_referencia_rango || a.REFERENCIA || "-",
          observaciones: a.interpretacion || "Normal",
          notas_internas: a.observaciones || "",
          tecnico: a.tecnico_responsable || "-",
          honorarios: Number(a.HONORARIOS) || 0
        }))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const procesarOrden = async (req: Request, res: Response) => { 
    await pool.query("UPDATE orden SET estado = 'en_proceso', fecha_procesamiento = NOW() WHERE id_orden = ? AND estado = 'pendiente'", [req.params.id_orden]);
    res.json({success:true}); 
};

export const cargarResultado = async (req: Request, res: Response) => { 
    const { id_orden_analisis } = req.params;
    const { resultado, observaciones } = req.body;
    await pool.query("UPDATE orden_analisis SET valor_hallado = ?, interpretacion = ?, estado = 'finalizado', fecha_realizacion = NOW() WHERE id_orden_analisis = ?", [resultado, observaciones, id_orden_analisis]);
    res.json({success:true});
};

export const getOrdenesBioquimico = async (req: Request, res: Response) => { res.json({success:true}) }; 

export default {
    completarPerfilBioquimico,
    getDashboardBioquimico,
    getOrdenesBioquimico,
    getOrdenesEntrantes,
    procesarOrden,
    cargarResultado,
    getDetalleOrden
};