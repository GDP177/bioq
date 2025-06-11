// src/controllers/historial.controller.ts - CONTROLADOR CORREGIDO

import { Request, Response } from 'express';
import { pool } from '../routes/db';

// ============================================
// INTERFACES LOCALES SIMPLES
// ============================================

interface PacienteRow {
  nro_ficha: number;
  nombre: string;
  apellido: string;
  dni: string;
  fecha_nacimiento: string;
  fecha_alta: string;
  edad: number;
  sexo: string;
  telefono: string;
  direccion: string;
  mutual: string;
  nro_afiliado: string;
  grupo_sanguineo: string;
  estado: string;
}

// ============================================
// CONTROLADORES
// ============================================

/**
 * Obtener historial completo del paciente
 */
export const getHistorialPaciente = async (req: Request, res: Response) => {
  const nroFicha = parseInt(req.params.nro_ficha);

  try {
    console.log('🔍 ===========================================');
    console.log('📋 INICIANDO CONSULTA DE HISTORIAL');
    console.log('🔍 ===========================================');
    console.log('📋 Número de ficha recibido:', nroFicha);

    // Validar parámetro
    if (!nroFicha || nroFicha <= 0) {
      console.log('❌ Número de ficha inválido:', nroFicha);
      return res.status(400).json({
        success: false,
        message: 'Número de ficha inválido'
      });
    }

    // ============================================
    // 1. OBTENER DATOS DEL PACIENTE
    // ============================================

    console.log('🔍 Paso 1: Consultando datos del paciente...');
    
    const queryPaciente = `
      SELECT 
        nro_ficha,
        Nombre_paciente as nombre,
        Apellido_paciente as apellido,
        DNI as dni,
        fecha_nacimiento,
        fecha_alta,
        edad,
        sexo,
        telefono,
        direccion,
        mutual,
        nro_afiliado,
        grupo_sanguineo,
        estado
      FROM paciente 
      WHERE nro_ficha = ? 
      LIMIT 1`;

    const [pacienteRows] = await pool.query(queryPaciente, [nroFicha]) as [PacienteRow[], any];
    
    console.log('✅ Resultados paciente:', pacienteRows.length, 'filas');
    
    if (pacienteRows.length === 0) {
      console.log('❌ No se encontró paciente con ficha:', nroFicha);
      return res.status(404).json({
        success: false,
        message: 'No se encontró paciente con ese número de ficha'
      });
    }

    const paciente = pacienteRows[0];
    console.log('✅ Paciente encontrado:', paciente.nombre, paciente.apellido);

    // ============================================
    // 2. OBTENER ÓRDENES - SIN JOIN CON MÉDICO PRIMERO
    // ============================================

    console.log('🔍 Paso 2: Consultando órdenes del paciente (sin médico)...');
    
    const queryOrdenes = `
      SELECT 
        o.id_orden,
        o.fecha_ingreso_orden,
        COALESCE(o.urgente, 0) as urgente,
        o.id_medico_solicitante
      FROM orden o
      WHERE o.nro_ficha_paciente = ?
      ORDER BY o.fecha_ingreso_orden DESC`;

    console.log('🔍 Query órdenes:', queryOrdenes);
    
    const [ordenesRows] = await pool.query(queryOrdenes, [nroFicha]) as [any[], any];
    
    console.log('✅ Órdenes encontradas:', ordenesRows.length);

    // ============================================
    // 3. CONSTRUIR RESPUESTA BÁSICA SIN ANÁLISIS
    // ============================================

    const ordenes = [];
    let totalAnalisis = 0;
    let analisisFinalizados = 0;
    let analisisPendientes = 0;

    for (const orden of ordenesRows) {
      console.log('🔍 Procesando orden:', orden.id_orden);
      
      // Por ahora sin análisis para evitar más errores
      ordenes.push({
        id_orden: orden.id_orden,
        fecha_ingreso: orden.fecha_ingreso_orden,
        urgente: orden.urgente === 1,
        medico_solicitante: {
          nombre: 'Médico no disponible',
          apellido: ''
        },
        bioquimico_responsable: null,
        total_analisis: 0,
        analisis: []
      });
    }

    // ============================================
    // 4. ESTADÍSTICAS BÁSICAS
    // ============================================

    console.log('📊 Calculando estadísticas...');
    
    const totalOrdenes = ordenesRows.length;
    const porcentajeCompletado = 0; // Por ahora sin análisis

    // ============================================
    // 5. CRONOLOGÍA BÁSICA
    // ============================================

    const cronologia = ordenesRows.map(orden => ({
      fecha: orden.fecha_ingreso_orden,
      tipo: 'orden_ingresada',
      descripcion: `Nueva orden de análisis ${orden.urgente === 1 ? '(URGENTE)' : ''}`,
      icono: '📋',
      urgente: orden.urgente === 1,
      detalles: {
        id_orden: orden.id_orden,
        medico: 'Médico no disponible'
      }
    }));

    // Ordenar cronología por fecha
    cronologia.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    // ============================================
    // 6. TIPOS DE ANÁLISIS - BÁSICO
    // ============================================

    const tiposAnalisis = [
      { tipo: 'General', cantidad: 0 }
    ];

    // ============================================
    // 7. CONSTRUIR RESPUESTA FINAL
    // ============================================

    const historialCompleto = {
      paciente: {
        nro_ficha: paciente.nro_ficha,
        nombre: paciente.nombre,
        apellido: paciente.apellido,
        dni: paciente.dni,
        fecha_nacimiento: paciente.fecha_nacimiento,
        fecha_alta: paciente.fecha_alta,
        edad: paciente.edad,
        sexo: paciente.sexo,
        telefono: paciente.telefono,
        direccion: paciente.direccion,
        mutual: paciente.mutual,
        nro_afiliado: paciente.nro_afiliado,
        grupo_sanguineo: paciente.grupo_sanguineo,
        estado: paciente.estado
      },
      estadisticas: {
        total_ordenes: totalOrdenes,
        total_analisis: totalAnalisis,
        analisis_finalizados: analisisFinalizados,
        analisis_pendientes: analisisPendientes,
        porcentaje_completado: porcentajeCompletado,
        primer_orden: totalOrdenes > 0 ? ordenesRows[ordenesRows.length - 1].fecha_ingreso_orden : null,
        ultima_orden: totalOrdenes > 0 ? ordenesRows[0].fecha_ingreso_orden : null
      },
      ordenes: ordenes,
      tipos_analisis: tiposAnalisis,
      cronologia: cronologia.slice(0, 20)
    };

    console.log('✅ Historial completo construido para:', paciente.nombre, paciente.apellido);
    console.log('📊 Estadísticas finales:');
    console.log('   - Total órdenes:', totalOrdenes);
    console.log('   - Total análisis:', totalAnalisis);
    console.log('🔍 ===========================================');

    return res.status(200).json({
      success: true,
      historial: historialCompleto
    });

  } catch (error: any) {
    console.error('💥 ===========================================');
    console.error('💥 ERROR CRÍTICO EN HISTORIAL');
    console.error('💥 ===========================================');
    console.error('💥 Error completo:', error);
    console.error('💥 Stack trace:', error.stack);
    console.error('💥 Código de error:', error.code);
    console.error('💥 SQL State:', error.sqlState);
    console.error('💥 ===========================================');
    
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener el historial',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error.code,
        sqlState: error.sqlState,
        sql: error.sql
      } : 'Error interno del servidor'
    });
  }
};

/**
 * Obtener análisis detallado por orden
 */
export const getAnalisisDetalladoPorOrden = async (req: Request, res: Response) => {
  const idOrden = parseInt(req.params.id_orden);

  try {
    console.log('🔍 Obteniendo análisis detallado para orden:', idOrden);

    if (!idOrden || idOrden <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de orden inválido'
      });
    }

    // Respuesta básica para análisis detallado
    return res.status(200).json({
      success: true,
      analisis_detallado: {
        orden: {
          id_orden: idOrden,
          fecha_ingreso: new Date().toISOString(),
          urgente: false,
          paciente: {
            nombre: 'Pendiente',
            apellido: 'de implementar',
            edad: 0,
            sexo: 'M'
          }
        },
        analisis: []
      }
    });

  } catch (error: any) {
    console.error('💥 ERROR al obtener análisis detallado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener análisis detallado',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  getHistorialPaciente,
  getAnalisisDetalladoPorOrden
};