// laboratorio-backend/src/controllers/bioquimico.controller.ts

import { Request, Response } from 'express';
import { pool } from '../routes/db';

// ==========================================
// 1. PERFIL BIOQUÍMICO - CORREGIDO Y BLINDADO
// ==========================================
export const completarPerfilBioquimico = async (req: Request, res: Response) => {
  const { 
    id_usuario, nombre_bq, apellido_bq, dni_bioquimico, matricula_profesional,
    telefono, direccion, fecha_habilitacion, fecha_vencimiento_matricula
  } = req.body;

  try {
    console.log("🧪 Intentando completar perfil bioquímico para usuario ID:", id_usuario);

    if (!id_usuario || !nombre_bq || !apellido_bq || !dni_bioquimico || !matricula_profesional) {
      return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' });
    }

    // 1. Obtener Email del Usuario
    const [userRows]: any = await pool.query('SELECT email FROM usuarios WHERE id_usuario = ?', [id_usuario]);
    if (userRows.length === 0) return res.status(404).json({ success: false, message: 'Usuario base no encontrado' });
    const userEmail = userRows[0].email;

    // 2. Buscamos si existe perfil previo
    const [existing]: any = await pool.query('SELECT matricula_profesional FROM bioquimico WHERE id_usuario = ?', [id_usuario]);
    
    if (existing.length > 0) {
       // === CASO A: ACTUALIZAR ===
       console.log(`✅ Actualizando bioquímico existente...`);

       // Validación (DNI, Matrícula O EMAIL duplicado en OTROS usuarios)
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
       // === CASO B: INSERTAR ===
       console.log("🆕 Creando nuevo bioquímico...");

       // Validación Global
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
    console.error("💥 Error completarPerfilBioquimico:", error);
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Datos duplicados detectados en la base de datos.' });
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. DASHBOARD
// ==========================================
export const getDashboardBioquimico = async (req: Request, res: Response) => {
  const matricula = req.params.matricula_profesional;
  try {
    const [bq]: any = await pool.query('SELECT * FROM bioquimico WHERE matricula_profesional = ?', [matricula]);
    if (bq.length === 0) return res.status(404).json({ success: false, message: 'Bioquímico no encontrado' });

    const [stats]: any = await pool.query(`
      SELECT 
        COUNT(*) as total_ordenes,
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as ordenes_pendientes,
        COUNT(CASE WHEN estado = 'en_proceso' THEN 1 END) as ordenes_proceso,
        COUNT(CASE WHEN estado = 'finalizado' THEN 1 END) as ordenes_completadas,
        COUNT(CASE WHEN DATE(fecha_ingreso_orden) = CURDATE() THEN 1 END) as ordenes_hoy
      FROM orden WHERE DATE(fecha_ingreso_orden) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);

    const [ordenes]: any = await pool.query(`
      SELECT o.id_orden, o.nro_orden, o.fecha_ingreso_orden, o.estado, o.urgente,
             p.Nombre_paciente, p.Apellido_paciente, p.DNI,
             (SELECT COUNT(*) FROM orden_analisis WHERE id_orden = o.id_orden) as total_analisis
      FROM orden o
      JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
      WHERE o.estado IN ('pendiente', 'en_proceso')
      ORDER BY o.urgente DESC, o.fecha_ingreso_orden ASC LIMIT 5
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
// 3. ÓRDENES ENTRANTES (LISTA COMPLETA) - ✅ CORREGIDO
// ==========================================
export const getOrdenesEntrantes = async (req: Request, res: Response) => {
    try {
        console.log("📥 Consultando órdenes entrantes para bioquímico...");
        
        // CORRECCIÓN CLAVE: 
        // 1. Join con tabla medico para obtener nombre del doctor.
        // 2. Subconsultas para contar total_analisis y analisis_listos (finalizados).
        // 3. Alias 'nombre_paciente' y 'apellido_paciente' para coincidir con el frontend.
        
        const query = `
            SELECT 
                o.id_orden, 
                o.nro_orden, 
                o.fecha_ingreso_orden, 
                o.estado, 
                o.urgente,
                p.Nombre_paciente as nombre_paciente, 
                p.Apellido_paciente as apellido_paciente, 
                p.DNI as dni, 
                p.edad,
                p.mutual,
                m.nombre_medico,
                m.apellido_medico,
                (SELECT COUNT(*) FROM orden_analisis WHERE id_orden = o.id_orden) as total_analisis,
                (SELECT COUNT(*) FROM orden_analisis WHERE id_orden = o.id_orden AND estado = 'finalizado') as analisis_listos
            FROM orden o
            JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
            LEFT JOIN medico m ON o.id_medico_solicitante = m.id_medico
            WHERE o.estado IN ('pendiente', 'en_proceso')
            ORDER BY 
                o.urgente DESC,        -- Prioridad 1: Urgentes
                o.fecha_ingreso_orden ASC -- Prioridad 2: FIFO
        `;
        
        const [ordenes]: any = await pool.query(query);
        console.log(`✅ ${ordenes.length} órdenes encontradas.`);
        
        return res.json({ success: true, ordenes });
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
      SELECT oa.*, a.descripcion_practica, a.unidad_bioquimica, a.REFERENCIA
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
          referencia: a.valor_referencia_aplicado || a.REFERENCIA || "",
          observaciones: a.interpretacion || "Normal",
          notas_internas: a.observaciones || "",
          tecnico: a.tecnico_responsable || "-"
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