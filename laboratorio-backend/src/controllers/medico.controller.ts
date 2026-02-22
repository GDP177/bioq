// src/controllers/medico.controller.ts

import { Request, Response } from 'express';
import { pool } from '../routes/db';
import bcrypt from 'bcrypt';

// ============================================
// OBTENER DETALLE DE UNA ORDEN (PARA EL MÉDICO)
// ============================================
export const getOrdenDetalle = async (req: Request, res: Response) => {
    const { id_orden } = req.params;

    try {
        console.log(`👨‍⚕️ Médico consultando detalle orden #${id_orden}`);

        // 1. Obtener cabecera de la orden, datos del paciente Y DATOS DEL MÉDICO
        const [ordenRows]: any = await pool.query(
            `SELECT 
                o.id_orden, 
                o.nro_orden, 
                o.fecha_ingreso_orden, 
                o.estado, 
                o.urgente,
                o.requiere_ayuno,
                o.observaciones as observaciones_medico,
                p.nro_ficha,
                p.Nombre_paciente, 
                p.Apellido_paciente, 
                p.DNI, 
                p.edad, 
                p.mutual,
                p.sexo,
                p.nro_afiliado,
                m.nombre_medico,
                m.apellido_medico,
                m.matricula_medica
             FROM orden o
             JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
             LEFT JOIN medico m ON o.id_medico_solicitante = m.id_medico
             WHERE o.id_orden = ?`,
            [id_orden]
        );

        if (ordenRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Orden no encontrada' });
        }

        const orden = ordenRows[0];

        // 2. Obtener análisis con el NOMBRE REAL
        const [analisisRows]: any = await pool.query(`
            SELECT 
                oa.id_orden_analisis,
                oa.codigo_practica,
                a.descripcion_practica,
                a.TIPO as tipo,
                oa.estado,
                oa.valor_hallado,
                oa.unidad_hallada,
                oa.observaciones as interpretacion,
                COALESCE(oa.valor_referencia_aplicado, a.REFERENCIA) as referencia
            FROM orden_analisis oa
            LEFT JOIN analisis a ON oa.codigo_practica = a.codigo_practica
            WHERE oa.id_orden = ?
            ORDER BY oa.codigo_practica`, 
            [id_orden]
        );

        // 3. Formatear para el frontend
        const analisisFormateados = analisisRows.map((a: any) => ({
            id: a.id_orden_analisis,
            codigo: a.codigo_practica,
            descripcion: a.descripcion_practica || `Práctica ${a.codigo_practica}`,
            tipo: a.tipo || "General",
            estado: a.estado,
            resultado: a.valor_hallado || "-",
            unidad: a.unidad_hallada || "",
            referencia: a.referencia || "",
            interpretacion: a.interpretacion || ""
        }));

        return res.json({
            success: true,
            orden: {
                id: orden.id_orden,
                nro_orden: orden.nro_orden || `ORD-${orden.id_orden}`,
                fecha: orden.fecha_ingreso_orden,
                estado: orden.estado,
                urgente: orden.urgente === 1,
                requiere_ayuno: orden.requiere_ayuno === 1,
                observaciones: orden.observaciones_medico,
                paciente: {
                    nro_ficha: orden.nro_ficha,
                    nombre: orden.Nombre_paciente,
                    apellido: orden.Apellido_paciente,
                    dni: orden.DNI,
                    edad: orden.edad,
                    mutual: orden.mutual,
                    sexo: orden.sexo,
                    nro_afiliado: orden.nro_afiliado
                },
                medico_solicitante: {
                    nombre: orden.nombre_medico || "Médico",
                    apellido: orden.apellido_medico || "No Asignado",
                    matricula: orden.matricula_medica || "S/M"
                },
                analisis: analisisFormateados
            }
        });

    } catch (error: any) {
        console.error("💥 Error en getOrdenDetalle (Médico):", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// Crear solicitudad medica
// ============================================
export const crearSolicitudMedica = async (req: Request, res: Response) => {
    let id_medico = req.params.id_medico || req.params.id;
    
    const { 
        nro_ficha_paciente, 
        analisis_solicitados, 
        urgente, 
        requiere_ayuno, 
        observaciones, 
        instrucciones_paciente,
        email_usuario 
    } = req.body;
    
    console.log("🔍 DEBUG BACKEND - Crear Solicitud:");
    console.log("   👉 Params recibidos:", req.params);

    const connection = await pool.getConnection();
    try {
        if (email_usuario) {
            const [medicoRows]: any = await connection.query(
                `SELECT id_medico FROM medico WHERE email = ? AND (activo = 1 OR activo IS NULL)`,
                [email_usuario]
            );

            if (medicoRows.length > 0) {
                const idReal = medicoRows[0].id_medico;
                id_medico = idReal;
                console.log(`✅ Identidad validada por email. Usando ID Médico: ${id_medico}`);
            } else {
                console.warn(`⚠️ El email ${email_usuario} no se encontró en la tabla de médicos.`);
            }
        }

        if (!id_medico || id_medico === 'undefined' || id_medico === 'null') {
             return res.status(400).json({ 
                success: false, 
                message: 'Error de identificación: No se recibió un ID de médico válido. Verifique su sesión.' 
            });
        }

        await connection.beginTransaction();

        const nro_orden = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        
        const [result]: any = await connection.query(
            `INSERT INTO orden (nro_orden, urgente, id_medico_solicitante, fecha_ingreso_orden, nro_ficha_paciente, estado, observaciones, requiere_ayuno, instrucciones_paciente) 
             VALUES (?, ?, ?, NOW(), ?, 'pendiente', ?, ?, ?)`,
            [nro_orden, urgente ? 1 : 0, id_medico, nro_ficha_paciente, observaciones, requiere_ayuno ? 1 : 0, instrucciones_paciente]
        );

        const id_orden = result.insertId;

        if (analisis_solicitados && analisis_solicitados.length > 0) {
            for (const codigo_practica of analisis_solicitados) {
                await connection.query(
                    `INSERT INTO orden_analisis (id_orden, codigo_practica, estado, fecha_creacion) 
                     VALUES (?, ?, 'pendiente', NOW())`,
                    [id_orden, codigo_practica]
                );
            }
        }

        await connection.commit();
        console.log(`🎉 Orden creada con éxito: #${id_orden}`);
        res.json({ success: true, orden_id: id_orden, nro_orden });

    } catch (error: any) {
        await connection.rollback();
        console.error("💥 Error crítico al crear solicitud:", error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

// ============================================
// MODIFICAR SOLICITUD MÉDICA
// ============================================
export const modificarSolicitudMedica = async (req: Request, res: Response) => {
    const { id_orden } = req.params;
    const { 
        analisis_solicitados,
        urgente, 
        requiere_ayuno, 
        observaciones, 
        instrucciones_paciente 
    } = req.body;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        console.log(`📝 Modificando orden #${id_orden}...`);

        const [ordenCheck]: any = await connection.query(
            `SELECT estado FROM orden WHERE id_orden = ?`, 
            [id_orden]
        );

        if (ordenCheck.length === 0) {
            return res.status(404).json({ success: false, message: 'Orden no encontrada' });
        }

        // Permitir modificación si está en pendiente, pero con la nueva lógica 
        // a veces una orden puede parecer 'en proceso' si se tocó algo. 
        // Por seguridad mantenemos la validación simple por ahora.
        if (ordenCheck[0].estado !== 'pendiente') {
            return res.status(400).json({ 
                success: false, 
                message: 'Solo se pueden modificar órdenes que estén en estado pendiente.' 
            });
        }

        await connection.query(
            `UPDATE orden 
             SET urgente = ?, requiere_ayuno = ?, observaciones = ?, instrucciones_paciente = ? 
             WHERE id_orden = ?`,
            [urgente ? 1 : 0, requiere_ayuno ? 1 : 0, observaciones, instrucciones_paciente, id_orden]
        );

        if (analisis_solicitados && analisis_solicitados.length > 0) {
            await connection.query(
                `DELETE FROM orden_analisis WHERE id_orden = ?`, 
                [id_orden]
            );

            for (const codigo_practica of analisis_solicitados) {
                await connection.query(
                    `INSERT INTO orden_analisis (id_orden, codigo_practica, estado, fecha_creacion) 
                     VALUES (?, ?, 'pendiente', NOW())`,
                    [id_orden, codigo_practica]
                );
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'Orden actualizada correctamente' });

    } catch (error: any) {
        await connection.rollback();
        console.error("💥 Error al modificar la orden:", error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

// ============================================
// LOGIN MÉDICO
// ============================================
export const loginMedico = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    console.log('🚀 LOGIN MÉDICO - Email:', email);

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
    }

    const query = `
      SELECT 
        u.id_usuario, u.email, u.password_hash, u.rol, u.username,
        m.id_medico, m.nombre_medico, m.apellido_medico, m.especialidad,
        m.matricula_medica, m.telefono, m.email as medico_email
      FROM usuarios u
      LEFT JOIN medico m ON u.id_usuario = m.id_usuario
      WHERE u.email = ? AND u.activo = 1
      LIMIT 1
    `;

    const [rows]: any = await pool.query(query, [email]);
    
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Correo no registrado o usuario inactivo' });
    }

    const usuario = rows[0];
    
    const isValidPassword = await bcrypt.compare(password, usuario.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }

    if (!usuario.id_medico) {
      return res.status(200).json({
        success: true,
        message: 'Login exitoso - Perfil incompleto',
        requiere_completar_perfil: true,
        usuario: {
          id_usuario: usuario.id_usuario,
          email: usuario.email,
          username: usuario.username,
          rol: usuario.rol
        }
      });
    } else {
      const usuarioData = {
        id: usuario.id_medico,
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre_medico,
        apellido: usuario.apellido_medico,
        email: usuario.email,
        rol: usuario.rol,
        especialidad: usuario.especialidad,
        matricula: usuario.matricula_medica,
        telefono: usuario.telefono
      };

      return res.status(200).json({
        success: true,
        message: 'Login exitoso',
        requiere_completar_perfil: false,
        medico: usuarioData
      });
    }

  } catch (error: any) {
    console.error('💥 ERROR EN LOGIN MÉDICO:', error);
    return res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

// ============================================
// DASHBOARD MÉDICO - 🚀 LÓGICA CORREGIDA PARA ESTADOS REALES Y GRÁFICO POR DÍAS
// ============================================
export const getDashboardMedico = async (req: Request, res: Response) => {
  const id_medico = parseInt(req.params.id_medico);

  try {
    console.log('📊 DASHBOARD MÉDICO - ID:', id_medico);

    if (!id_medico || isNaN(id_medico)) {
      return res.status(400).json({ success: false, message: 'ID de médico inválido' });
    }

    // 1. Obtener datos del médico
    const [medicoRows]: any = await pool.query(
      `SELECT * FROM medico WHERE id_medico = ? AND (activo IS NULL OR activo = 1)`, 
      [id_medico]
    );

    if (medicoRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Médico no encontrado' });
    }
    const medico = medicoRows[0];
    
    // 2. ESTADÍSTICAS GENERALES (Totales simples)
    const [ordenesRows]: any = await pool.query(
      `SELECT COUNT(*) as total_ordenes, SUM(CASE WHEN urgente = 1 THEN 1 ELSE 0 END) as urgentes
       FROM orden WHERE id_medico_solicitante = ?`,
      [id_medico]
    );
    const estadisticasOrdenes = ordenesRows[0] || { total_ordenes: 0, urgentes: 0 };

    // 3. ESTADÍSTICAS DINÁMICAS (Calculadas sobre los análisis)
    // Aquí ignoramos el estado de la tabla orden y miramos la realidad en orden_analisis
    const [statsReales]: any = await pool.query(`
        SELECT 
            COUNT(DISTINCT CASE WHEN estado_calc = 'pendiente' THEN id_orden END) as pendientes,
            COUNT(DISTINCT CASE WHEN estado_calc = 'finalizada' THEN id_orden END) as finalizadas,
            COUNT(DISTINCT nro_ficha) as pacientes_activos
        FROM (
            SELECT 
                o.id_orden, o.nro_ficha_paciente as nro_ficha,
                CASE 
                    -- Si tiene análisis y NINGUNO está pendiente/en_proceso, es finalizada
                    WHEN COUNT(oa.id_orden_analisis) > 0 
                         AND SUM(CASE WHEN oa.estado != 'finalizado' THEN 1 ELSE 0 END) = 0 
                    THEN 'finalizada'
                    -- Si no, es pendiente
                    ELSE 'pendiente'
                END as estado_calc
            FROM orden o
            LEFT JOIN orden_analisis oa ON o.id_orden = oa.id_orden
            WHERE o.id_medico_solicitante = ?
            GROUP BY o.id_orden
        ) as subquery
    `, [id_medico]);
    
    const statsExtras = statsReales[0] || { pendientes: 0, finalizadas: 0, pacientes_activos: 0 };

    // 4. DATOS PARA EL GRÁFICO (Historial por DÍAS - Últimos 14 días)
    const [graficoRows]: any = await pool.query(
      `SELECT
          DATE_FORMAT(fecha_ingreso_orden, '%d/%m') as periodo,
          COUNT(*) as cantidad
       FROM orden
       WHERE id_medico_solicitante = ?
       AND fecha_ingreso_orden >= DATE_SUB(NOW(), INTERVAL 14 DAY)
       GROUP BY DATE_FORMAT(fecha_ingreso_orden, '%d/%m'), DATE(fecha_ingreso_orden)
       ORDER BY DATE(fecha_ingreso_orden) ASC`,
      [id_medico]
    );

    // 5. LISTAS PARA EL DASHBOARD (Usando HAVING para filtrar por estado calculado)

    // A. LISTA PENDIENTES (Imagen 1 del dashboard)
    // Traemos las que tienen algún análisis NO finalizado
    const [listaPendientes]: any = await pool.query(
      `SELECT o.id_orden, o.nro_orden, o.fecha_ingreso_orden, o.urgente,
              p.Nombre_paciente, p.Apellido_paciente, 'pendiente' as estado
       FROM orden o
       JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
       LEFT JOIN orden_analisis oa ON o.id_orden = oa.id_orden
       WHERE o.id_medico_solicitante = ?
       GROUP BY o.id_orden
       HAVING COUNT(oa.id_orden_analisis) > 0 
          AND SUM(CASE WHEN oa.estado != 'finalizado' THEN 1 ELSE 0 END) > 0
       ORDER BY o.fecha_ingreso_orden DESC LIMIT 5`,
       [id_medico]
    );

    // B. LISTA FINALIZADAS (Imagen 2 del dashboard)
    // Traemos las que tienen TODOS sus análisis finalizados
    const [listaFinalizadas]: any = await pool.query(
      `SELECT o.id_orden, o.nro_orden, o.fecha_ingreso_orden, o.urgente,
              MAX(oa.fecha_realizacion) as fecha_finalizacion, -- Usamos la fecha del último análisis
              p.Nombre_paciente, p.Apellido_paciente, 'finalizada' as estado
       FROM orden o
       JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
       LEFT JOIN orden_analisis oa ON o.id_orden = oa.id_orden
       WHERE o.id_medico_solicitante = ?
       GROUP BY o.id_orden
       HAVING COUNT(oa.id_orden_analisis) > 0 
          AND SUM(CASE WHEN oa.estado != 'finalizado' THEN 1 ELSE 0 END) = 0
       ORDER BY fecha_finalizacion DESC LIMIT 5`,
       [id_medico]
    );

    // 6. LISTA DE PACIENTES RECIENTES (Sin cambios)
    const [pacientesRows]: any = await pool.query(
      `SELECT DISTINCT
        p.nro_ficha, p.Nombre_paciente, p.Apellido_paciente, p.DNI, p.edad, p.sexo, p.mutual, p.telefono,
        MAX(o.fecha_ingreso_orden) as ultima_orden, COUNT(o.id_orden) as total_ordenes
       FROM paciente p
       JOIN orden o ON p.nro_ficha = o.nro_ficha_paciente
       WHERE o.id_medico_solicitante = ?
       GROUP BY p.nro_ficha, p.Nombre_paciente, p.Apellido_paciente, p.DNI, p.edad, p.sexo, p.mutual, p.telefono
       ORDER BY MAX(o.fecha_ingreso_orden) DESC LIMIT 8`,
      [id_medico]
    );

    const notificaciones = [];
    if ((estadisticasOrdenes.urgentes || 0) > 0) {
      notificaciones.push(`⚠️ Tienes ${estadisticasOrdenes.urgentes} orden(es) urgente(s)`);
    } else {
      notificaciones.push('🎉 ¡Todo al día! No hay notificaciones pendientes');
    }

    const dashboardData = {
      success: true,
      medico: {
        id: medico.id_medico,
        nombre: medico.nombre_medico,
        apellido: medico.apellido_medico,
        email: medico.email,
        especialidad: medico.especialidad || 'Medicina General',
        matricula: medico.matricula_medica,
        telefono: medico.telefono,
        rol: 'medico'
      },
      estadisticas: {
        total_ordenes: parseInt(estadisticasOrdenes.total_ordenes) || 0,
        ordenes_urgentes: parseInt(estadisticasOrdenes.urgentes) || 0,
        en_proceso: parseInt(statsExtras.pendientes) || 0, // Usamos 'pendientes' reales para 'en proceso'
        para_revisar: parseInt(statsExtras.finalizadas) || 0, // Usamos 'finalizadas' reales
        pacientes_activos: parseInt(statsExtras.pacientes_activos) || 0,
        total_pacientes: pacientesRows.length
      },
      grafico: graficoRows,
      listas: {
          pendientes: listaPendientes,
          finalizadas: listaFinalizadas
      },
      pacientes_recientes: pacientesRows.map((paciente: any) => ({
        nro_ficha: paciente.nro_ficha,
        nombre: paciente.Nombre_paciente,
        apellido: paciente.Apellido_paciente,
        dni: parseInt(paciente.DNI) || 0,
        edad: paciente.edad,
        sexo: paciente.sexo,
        mutual: paciente.mutual,
        telefono: paciente.telefono,
        ultima_orden: paciente.ultima_orden,
        total_ordenes: parseInt(paciente.total_ordenes)
      })),
      notificaciones,
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(dashboardData);

  } catch (error: any) {
    console.error("💥 ERROR EN DASHBOARD:", error);
    return res.status(500).json({ success: false, message: "Error al obtener dashboard" });
  }
};

// ============================================
// COMPLETAR PERFIL MÉDICO
// ============================================
export const completarPerfilMedico = async (req: Request, res: Response) => {
    const { 
        id_usuario,
        nombre_medico,
        apellido_medico,
        dni_medico,
        matricula_medica,
        especialidad,
        telefono,
        direccion 
    } = req.body;

    try {
        console.log("📝 Intentando completar perfil médico para usuario ID:", id_usuario);

        if (!id_usuario || !nombre_medico || !apellido_medico || !dni_medico || !matricula_medica) {
            return res.status(400).json({ success: false, message: 'Faltan datos obligatorios.' });
        }

        // 1. Obtener el EMAIL del usuario actual
        const [userRows]: any = await pool.query('SELECT email FROM usuarios WHERE id_usuario = ?', [id_usuario]);
        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }
        const userEmail = userRows[0].email;

        // 2. Buscamos si existe un registro en tabla 'medico'
        const [medicoRows]: any = await pool.query(
            'SELECT id_medico FROM medico WHERE id_usuario = ?',
            [id_usuario]
        );

        let id_medico_final;

        if (medicoRows.length > 0) {
            // === CASO A: ACTUALIZAR ===
            const id_medico_existente = medicoRows[0].id_medico;
            const [duplicados]: any = await pool.query(
                `SELECT id_medico FROM medico 
                 WHERE (dni_medico = ? OR matricula_medica = ? OR email = ?) 
                 AND id_medico != ?`,
                [dni_medico, matricula_medica, userEmail, id_medico_existente]
            );

            if (duplicados.length > 0) {
                return res.status(409).json({ success: false, message: 'Datos duplicados (DNI, Matrícula o Email).' });
            }

            await pool.query(
                `UPDATE medico SET 
                    nombre_medico = ?, apellido_medico = ?, dni_medico = ?, matricula_medica = ?, 
                    especialidad = ?, telefono = ?, direccion = ?, activo = 1, fecha_modificacion = NOW()
                 WHERE id_medico = ?`,
                [nombre_medico, apellido_medico, dni_medico, matricula_medica, especialidad, telefono, direccion, id_medico_existente]
            );
            
            id_medico_final = id_medico_existente;

        } else {
            // === CASO B: INSERTAR ===
            const [duplicados]: any = await pool.query(
                `SELECT id_medico FROM medico 
                 WHERE dni_medico = ? OR matricula_medica = ? OR email = ?`,
                [dni_medico, matricula_medica, userEmail]
            );
            
            if (duplicados.length > 0) {
                return res.status(409).json({ success: false, message: 'Datos duplicados (DNI, Matrícula o Email).' });
            }

            const [insertResult]: any = await pool.query(
                `INSERT INTO medico (
                    id_usuario, nombre_medico, apellido_medico, dni_medico, matricula_medica, 
                    especialidad, telefono, direccion, email, activo, fecha_creacion
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
                [id_usuario, nombre_medico, apellido_medico, dni_medico, matricula_medica, especialidad, telefono, direccion, userEmail]
            );

            id_medico_final = insertResult.insertId;
        }

        const [medicoFinal]: any = await pool.query(
            `SELECT m.*, u.rol FROM medico m 
             JOIN usuarios u ON m.id_usuario = u.id_usuario 
             WHERE m.id_medico = ?`, 
            [id_medico_final]
        );

        return res.status(201).json({
            success: true,
            message: 'Perfil completado exitosamente.',
            usuario: {
                id: medicoFinal[0].id_medico,
                id_usuario: medicoFinal[0].id_usuario,
                nombre: medicoFinal[0].nombre_medico,
                apellido: medicoFinal[0].apellido_medico,
                email: medicoFinal[0].email,
                rol: medicoFinal[0].rol
            }
        });

    } catch (error: any) {
        console.error("💥 Error en completarPerfilMedico:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export default {
    getOrdenDetalle,
    crearSolicitudMedica,
    modificarSolicitudMedica,
    loginMedico,
    getDashboardMedico,
    completarPerfilMedico
};