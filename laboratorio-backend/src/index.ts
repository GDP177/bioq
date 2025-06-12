// src/index.ts - SERVIDOR COMPLETAMENTE FUNCIONAL CON PACIENTES

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';

// Importar rutas existentes que funcionan
import medicoRoutes from './routes/medico.routes';

// Importar controladores existentes que funcionan
import { 
  registrarNuevoPaciente,
  actualizarPaciente,
  buscarPacientePorDNI,
  buscarPacientePorFicha,
  buscarObrasSociales,
  buscarPacientesPorDNIParcial
} from './controllers/paciente.controller';

import {
  getHistorialPaciente,
  getAnalisisDetalladoPorOrden
} from './controllers/historial.controller';

import { pool } from './routes/db';

// Configurar dotenv
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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
// CONTROLADORES INLINE FUNCIONALES
// ============================================

// OBTENER ÓRDENES DEL MÉDICO
const getOrdenesMedico = async (req: Request, res: Response) => {
  const id_medico = parseInt(req.params.id_medico);
  
  const estado = getStringParam(req.query.estado);
  const urgente = getBooleanParam(req.query.urgente);
  const buscar = getStringParam(req.query.buscar);
  const limite = getNumberParam(req.query.limite, 50);
  const offset = getNumberParam(req.query.offset, 0);

  try {
    console.log('📋 Obteniendo órdenes para médico ID:', id_medico);

    if (!id_medico || id_medico <= 0) {
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
        p.DNI LIKE ?
      )`);
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.join(' AND ');

    // Query simplificada sin LEFT JOIN problemático
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
        p.edad
      FROM orden o
      JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
      WHERE ${whereClause}
      ORDER BY o.fecha_ingreso_orden DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limite, offset);

    const [ordenesRows]: [any[], any] = await pool.query(mainQuery, queryParams);

    // Contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orden o
      JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
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
        total_analisis: 0, // Se calculará después si es necesario
        analisis_listos: 0,
        porcentaje: 0
      }
    }));

    console.log('✅ Órdenes obtenidas:', ordenes.length);

    return res.status(200).json({
      success: true,
      ordenes,
      total,
      pagina_actual: Math.floor(offset / limite) + 1,
      total_paginas: Math.ceil(total / limite),
      filtros_aplicados: { estado, urgente, buscar }
    });

  } catch (error: any) {
    console.error('💥 ERROR al obtener órdenes:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al obtener órdenes'
    });
  }
};

// OBTENER DETALLE DE ORDEN
const getOrdenDetalle = async (req: Request, res: Response) => {
  const id_orden = parseInt(req.params.id_orden);
  const id_medico = parseInt(req.params.id_medico);

  try {
    console.log('🔍 Obteniendo detalle de orden ID:', id_orden, 'para médico:', id_medico);

    if (!id_orden || !id_medico) {
      return res.status(400).json({ 
        success: false,
        message: 'IDs inválidos' 
      });
    }

    // Query simple sin JOINs problemáticos
    const [ordenRows]: [any[], any] = await pool.query(
      `SELECT 
        o.id_orden,
        o.nro_orden,
        o.fecha_ingreso_orden,
        o.fecha_procesamiento,
        o.fecha_finalizacion,
        o.estado,
        COALESCE(o.urgente, 0) as urgente,
        o.observaciones,
        p.nro_ficha,
        p.Nombre_paciente as nombre_paciente,
        p.Apellido_paciente as apellido_paciente,
        p.DNI as dni,
        p.edad,
        p.sexo,
        p.mutual
       FROM orden o
       JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
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

    // Obtener análisis simple sin JOINs problemáticos
    const [analisisRows]: [any[], any] = await pool.query(
      `SELECT 
        oa.id_orden_analisis,
        oa.codigo_practica,
        oa.estado,
        oa.fecha_realizacion,
        oa.valor_hallado,
        oa.observaciones
       FROM orden_analisis oa
       WHERE oa.id_orden = ?
       ORDER BY oa.codigo_practica`,
      [id_orden]
    );

    const detalleOrden = {
      success: true,
      orden: {
        id: orden.id_orden,
        nro_orden: orden.nro_orden || `ORD-${orden.id_orden}`,
        fecha_ingreso: orden.fecha_ingreso_orden,
        fecha_procesamiento: orden.fecha_procesamiento,
        fecha_finalizacion: orden.fecha_finalizacion,
        estado: orden.estado,
        urgente: orden.urgente === 1,
        observaciones: orden.observaciones,
        
        paciente: {
          nro_ficha: orden.nro_ficha,
          nombre: orden.nombre_paciente,
          apellido: orden.apellido_paciente,
          dni: orden.dni,
          edad: orden.edad,
          sexo: orden.sexo,
          mutual: orden.mutual
        },
        
        analisis: analisisRows.map((analisis: any) => ({
          id: analisis.id_orden_analisis,
          codigo: analisis.codigo_practica,
          descripcion: `Análisis ${analisis.codigo_practica}`,
          estado: analisis.estado,
          fecha_realizacion: analisis.fecha_realizacion,
          valor_hallado: analisis.valor_hallado,
          observaciones: analisis.observaciones
        })),
        
        resumen: {
          total_analisis: analisisRows.length,
          analisis_pendientes: analisisRows.filter((a: any) => a.estado === 'pendiente').length,
          analisis_finalizados: analisisRows.filter((a: any) => a.estado === 'finalizado').length,
          porcentaje_completado: analisisRows.length > 0 ? 
            Math.round((analisisRows.filter((a: any) => a.estado === 'finalizado').length / analisisRows.length) * 100) : 0
        }
      }
    };

    console.log('✅ Detalle de orden preparado');

    return res.status(200).json(detalleOrden);

  } catch (error: any) {
    console.error('💥 ERROR al obtener detalle de orden:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al obtener detalle de orden'
    });
  }
};

// OBTENER ANÁLISIS DEL MÉDICO
const getAnalisisMedico = async (req: Request, res: Response) => {
  const id_medico = parseInt(req.params.id_medico);
  
  const estado = getStringParam(req.query.estado) || 'todos';
  const buscar = getStringParam(req.query.buscar);

  try {
    console.log('🧪 Obteniendo análisis para médico ID:', id_medico);

    if (!id_medico || id_medico <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de médico inválido'
      });
    }

    let whereConditions = ['o.id_medico_solicitante = ?'];
    let queryParams: any[] = [id_medico];

    if (estado && estado !== 'todos') {
      switch (estado) {
        case 'pendiente':
          whereConditions.push('oa.fecha_realizacion IS NULL');
          break;
        case 'finalizado':
          whereConditions.push('oa.fecha_realizacion IS NOT NULL');
          break;
      }
    }

    if (buscar && buscar.length > 0) {
      const searchTerm = `%${buscar}%`;
      whereConditions.push(`(
        p.Nombre_paciente LIKE ? OR 
        p.Apellido_paciente LIKE ? OR 
        p.DNI LIKE ?
      )`);
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.join(' AND ');

    // Query simple sin JOINs problemáticos
    const mainQuery = `
      SELECT 
        oa.id_orden_analisis,
        oa.codigo_practica,
        oa.fecha_realizacion,
        oa.valor_hallado,
        oa.estado,
        o.id_orden,
        o.fecha_ingreso_orden,
        COALESCE(o.urgente, 0) as urgente,
        p.Nombre_paciente as nombre_paciente,
        p.Apellido_paciente as apellido_paciente,
        p.DNI as dni,
        p.edad
      FROM orden_analisis oa
      JOIN orden o ON oa.id_orden = o.id_orden
      JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
      WHERE ${whereClause}
      ORDER BY o.fecha_ingreso_orden DESC
      LIMIT 500
    `;

    const [analisisRows]: [any[], any] = await pool.query(mainQuery, queryParams);

    // Estadísticas
    const estadisticasQuery = `
      SELECT 
        COUNT(*) as total_analisis,
        SUM(CASE WHEN oa.fecha_realizacion IS NULL THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN oa.fecha_realizacion IS NOT NULL THEN 1 ELSE 0 END) as finalizados
      FROM orden_analisis oa
      JOIN orden o ON oa.id_orden = o.id_orden
      WHERE ${whereClause}
    `;

    const [estadisticasRows]: [any[], any] = await pool.query(estadisticasQuery, queryParams);
    const estadisticas = estadisticasRows[0] || {
      total_analisis: 0,
      pendientes: 0,
      finalizados: 0
    };

    const analisisFormateados = analisisRows.map((item: any) => {
      let estadoItem = 'pendiente';
      if (item.fecha_realizacion) {
        estadoItem = 'finalizado';
      }

      return {
        id: item.id_orden_analisis || Date.now() + Math.random(),
        codigo_practica: item.codigo_practica,
        descripcion: `Análisis ${item.codigo_practica}`,
        tipo: 'General',
        estado: estadoItem,
        fecha_realizacion: item.fecha_realizacion,
        valor_hallado: item.valor_hallado,
        orden: {
          id: item.id_orden,
          nro_orden: `ORD-${item.id_orden}`,
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

    console.log('✅ Análisis obtenidos:', analisisFormateados.length);

    return res.status(200).json({
      success: true,
      analisis: analisisFormateados,
      total: analisisRows.length,
      estadisticas: {
        total_analisis: parseInt(estadisticas.total_analisis) || 0,
        pendientes: parseInt(estadisticas.pendientes) || 0,
        procesando: 0,
        finalizados: parseInt(estadisticas.finalizados) || 0,
        con_resultados: analisisRows.filter((a: any) => a.valor_hallado).length
      },
      filtros_aplicados: { estado, buscar },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('💥 ERROR al obtener análisis:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor al obtener análisis'
    });
  }
};

// OBTENER PACIENTES DEL MÉDICO - NUEVO CONTROLADOR
const getPacientesMedico = async (req: Request, res: Response) => {
  const id_medico = parseInt(req.params.id_medico);
  
  const buscar = getStringParam(req.query.buscar);
  const mutual = getStringParam(req.query.mutual);
  const sexo = getStringParam(req.query.sexo);
  const orden = getStringParam(req.query.orden) || 'reciente';
  const pagina = getNumberParam(req.query.pagina, 1);
  const limite = getNumberParam(req.query.limite, 20);

  try {
    console.log('👥 ==========================================');
    console.log('👥 OBTENIENDO PACIENTES PARA MÉDICO');
    console.log('👥 ==========================================');
    console.log('👨‍⚕️ ID Médico:', id_medico);
    console.log('🔍 Filtros:', { buscar, mutual, sexo, orden, pagina, limite });

    if (!id_medico || id_medico <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de médico inválido'
      });
    }

    // Construir WHERE clause
    let whereConditions = ['o.id_medico_solicitante = ?'];
    let queryParams: any[] = [id_medico];

    if (buscar && buscar.length > 0) {
      const searchTerm = `%${buscar}%`;
      whereConditions.push(`(
        p.Nombre_paciente LIKE ? OR 
        p.Apellido_paciente LIKE ? OR 
        p.DNI LIKE ?
      )`);
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (mutual && mutual !== 'todos') {
      whereConditions.push('p.mutual = ?');
      queryParams.push(mutual);
    }

    if (sexo && sexo !== 'todos') {
      whereConditions.push('p.sexo = ?');
      queryParams.push(sexo);
    }

    const whereClause = whereConditions.join(' AND ');

    // Determinar ORDER BY
    let orderBy = 'MAX(o.fecha_ingreso_orden) DESC';
    switch (orden) {
      case 'nombre':
        orderBy = 'p.Apellido_paciente ASC, p.Nombre_paciente ASC';
        break;
      case 'edad_desc':
        orderBy = 'p.edad DESC';
        break;
      case 'edad_asc':
        orderBy = 'p.edad ASC';
        break;
      case 'mas_ordenes':
        orderBy = 'COUNT(o.id_orden) DESC';
        break;
      default:
        orderBy = 'MAX(o.fecha_ingreso_orden) DESC';
        break;
    }

    // Calcular offset para paginación
    const offset = (pagina - 1) * limite;

    // Query principal
    const mainQuery = `
      SELECT 
        p.nro_ficha,
        p.Nombre_paciente as nombre_paciente,
        p.Apellido_paciente as apellido_paciente,
        p.DNI as dni,
        p.fecha_nacimiento,
        p.edad,
        p.sexo,
        p.telefono,
        p.direccion,
        p.mutual,
        p.nro_afiliado,
        p.grupo_sanguineo,
        p.estado,
        p.fecha_alta,
        COUNT(o.id_orden) as total_ordenes,
        MAX(o.fecha_ingreso_orden) as ultima_orden
      FROM paciente p
      JOIN orden o ON p.nro_ficha = o.nro_ficha_paciente
      WHERE ${whereClause}
      GROUP BY p.nro_ficha, p.Nombre_paciente, p.Apellido_paciente, p.DNI, 
               p.fecha_nacimiento, p.edad, p.sexo, p.telefono, p.direccion,
               p.mutual, p.nro_afiliado, p.grupo_sanguineo, p.estado, p.fecha_alta
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limite, offset);

    console.log('🔍 Query ejecutándose:', mainQuery);
    console.log('🔍 Parámetros:', queryParams);

    const [pacientesRows]: [any[], any] = await pool.query(mainQuery, queryParams);

    // Query para contar total
    const countQuery = `
      SELECT COUNT(DISTINCT p.nro_ficha) as total
      FROM paciente p
      JOIN orden o ON p.nro_ficha = o.nro_ficha_paciente
      WHERE ${whereClause}
    `;

    const [countRows]: [any[], any] = await pool.query(countQuery, queryParams.slice(0, -2));
    const total = countRows[0]?.total || 0;

    console.log('📊 Pacientes encontrados:', pacientesRows.length);
    console.log('📊 Total de pacientes:', total);

    // Formatear respuesta
    const pacientesFormateados = pacientesRows.map((paciente: any) => ({
      nro_ficha: paciente.nro_ficha,
      nombre: paciente.nombre_paciente,
      apellido: paciente.apellido_paciente,
      dni: paciente.dni,
      fecha_nacimiento: paciente.fecha_nacimiento,
      edad: paciente.edad,
      sexo: paciente.sexo,
      telefono: paciente.telefono,
      direccion: paciente.direccion,
      mutual: paciente.mutual,
      nro_afiliado: paciente.nro_afiliado,
      grupo_sanguineo: paciente.grupo_sanguineo,
      estado: paciente.estado,
      fecha_alta: paciente.fecha_alta,
      total_ordenes: paciente.total_ordenes,
      ultima_orden: paciente.ultima_orden
    }));

    console.log('✅ Pacientes procesados y formateados:', pacientesFormateados.length);
    console.log('👥 ==========================================');

    return res.status(200).json({
      success: true,
      pacientes: pacientesFormateados,
      total,
      pagina_actual: pagina,
      total_paginas: Math.ceil(total / limite),
      filtros_aplicados: {
        buscar,
        mutual,
        sexo,
        orden
      }
    });

  } catch (error: any) {
    console.error('💥 ==========================================');
    console.error('💥 ERROR AL OBTENER PACIENTES');
    console.error('💥 ==========================================');
    console.error('💥 Error completo:', error);
    console.error('💥 Stack:', error.stack);
    console.error('💥 ==========================================');
    
    return res.status(500).json({ 
      success: false,
      message: 'Error al obtener pacientes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// MIDDLEWARES PRINCIPALES
// ============================================

app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🌐 ${timestamp} - ${req.method} ${req.originalUrl}`);
  
  if (Object.keys(req.query).length > 0) {
    console.log(`🔗 Query:`, req.query);
  }
  
  console.log('─'.repeat(30));
  next();
});

// ============================================
// RUTAS PRINCIPALES
// ============================================

console.log('🔧 Configurando rutas...');

// Rutas del módulo médico
app.use('/api/medico', medicoRoutes);

// Rutas de pacientes
app.post('/api/pacientes', registrarNuevoPaciente);
app.post('/api/paciente/registrar', registrarNuevoPaciente);
app.put('/api/paciente/actualizar/:nro_ficha', actualizarPaciente);
app.get('/api/paciente/buscar/:dni', buscarPacientePorDNI);
app.get('/api/paciente/buscar/ficha/:nro_ficha', buscarPacientePorFicha);
app.get('/api/pacientes/buscar-por-dni/:dni_parcial', buscarPacientesPorDNIParcial);

// Rutas de historial
app.get('/api/paciente/historial/:nro_ficha', getHistorialPaciente);
app.get('/api/orden/analisis/:id_orden', getAnalisisDetalladoPorOrden);

// Rutas de órdenes - INLINE FUNCIONALES
app.get('/api/medico/:id_medico/ordenes', getOrdenesMedico);
app.get('/api/medico/:id_medico/orden/:id_orden', getOrdenDetalle);

// Rutas de análisis - INLINE FUNCIONALES
app.get('/api/medico/:id_medico/analisis', getAnalisisMedico);

// Rutas de pacientes del médico - NUEVA RUTA
app.get('/api/medico/:id_medico/pacientes', getPacientesMedico);

// Rutas de obras sociales
app.get('/api/obras-sociales/buscar/:texto', buscarObrasSociales);

// ============================================
// RUTAS DE SISTEMA
// ============================================

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Servidor funcionando - VERSIÓN ESTABLE CON PACIENTES',
    version: '2.2.0'
  });
});

app.get('/api/test-db', async (req: Request, res: Response) => {
  try {
    const [rows]: [any[], any] = await pool.query('SELECT 1 as test, NOW() as timestamp');
    res.json({
      success: true,
      message: 'Conexión a base de datos exitosa',
      data: rows[0]
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error de conexión a base de datos',
      error: error.message
    });
  }
});

app.get('/api', (req: Request, res: Response) => {
  res.json({ 
    message: 'API del Sistema de Laboratorio Bioquímico - VERSIÓN ESTABLE CON PACIENTES',
    version: '2.2.0',
    status: '✅ Todas las funcionalidades activas',
    endpoints_funcionando: [
      '✅ Dashboard médico',
      '✅ Login y autenticación', 
      '✅ Gestión de pacientes',
      '✅ Lista de pacientes del médico',
      '✅ Historial médico',
      '✅ Gestión de órdenes',
      '✅ Gestión de análisis',
      '✅ Obras sociales'
    ]
  });
});

// ============================================
// MIDDLEWARES DE ERROR
// ============================================

app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ 
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('💥 ERROR DEL SERVIDOR:', err.message);
  res.status(500).json({ 
    success: false,
    message: 'Error interno del servidor'
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, async () => {
  console.clear();
  
  console.log('\n✅ =========================================');
  console.log('✅ LABORATORIO BIOQUÍMICO - COMPLETAMENTE FUNCIONAL');
  console.log('✅ =========================================');
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🖥️  Frontend: http://localhost:3000`);
  console.log('✅ =========================================');
  console.log('🎯 TODAS LAS FUNCIONALIDADES ACTIVAS:');
  console.log('   ✅ Dashboard médico');
  console.log('   ✅ Gestión de órdenes');
  console.log('   ✅ Detalle de órdenes');
  console.log('   ✅ Gestión de análisis');
  console.log('   ✅ Gestión de pacientes');
  console.log('   ✅ Lista de pacientes del médico');
  console.log('   ✅ Historial médico');
  console.log('✅ =========================================');
  console.log('🚀 Sistema 100% funcional');
  console.log('');
  
  // Test de BD
  try {
    await pool.query('SELECT 1');
    console.log('✅ Base de datos conectada correctamente');
  } catch (error) {
    console.error('❌ Error de conexión a BD:', error);
  }
});

export default app;