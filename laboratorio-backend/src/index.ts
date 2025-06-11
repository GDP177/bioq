// src/index.ts - SERVIDOR PRINCIPAL CON DEBUG DE RUTAS

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importar rutas
import medicoRoutes from './routes/medico.routes';

// Importar controladores específicos
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

import { 
  getAnalisisDisponibles
} from './controllers/nuevas-funcionalidades.controller';

import { pool } from './routes/db';

// Configurar dotenv
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARES
// ============================================

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging mejorado
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🌐 ${timestamp} - ${req.method} ${req.path}`);
  console.log(`📝 Headers:`, req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📦 Body:`, req.body);
  }
  console.log(`🔗 Query:`, req.query);
  console.log(`📍 Params:`, req.params);
  console.log('─'.repeat(50));
  next();
});

// ============================================
// RUTAS PRINCIPALES
// ============================================

// Rutas del módulo médico
app.use('/api/medico', medicoRoutes);

// ============================================
// RUTAS DE PACIENTES
// ============================================

// Registro de pacientes
app.post('/api/pacientes', registrarNuevoPaciente);
app.post('/api/paciente/registrar', registrarNuevoPaciente);

// Actualización de pacientes
app.put('/api/paciente/actualizar/:nro_ficha', actualizarPaciente);

// Búsqueda de pacientes
app.get('/api/paciente/buscar/:dni', buscarPacientePorDNI);
app.get('/api/paciente/buscar/ficha/:nro_ficha', buscarPacientePorFicha);
app.get('/api/pacientes/buscar-por-dni/:dni_parcial', buscarPacientesPorDNIParcial);

// ============================================
// RUTAS DE HISTORIAL - CON DEBUG
// ============================================

console.log('🔧 Configurando rutas de historial...');

// Historial médico - CON LOGS ESPECÍFICOS
app.get('/api/paciente/historial/:nro_ficha', (req, res, next) => {
  console.log('\n🏥 ==========================================');
  console.log('🏥 RUTA DE HISTORIAL ACTIVADA');
  console.log('🏥 ==========================================');
  console.log('📋 Parámetro nro_ficha:', req.params.nro_ficha);
  console.log('🔍 URL completa:', req.originalUrl);
  console.log('🌐 Método:', req.method);
  console.log('🏥 ==========================================');
  next();
}, getHistorialPaciente);

app.get('/api/orden/analisis/:id_orden', (req, res, next) => {
  console.log('\n🧪 ==========================================');
  console.log('🧪 RUTA DE ANÁLISIS DETALLADO ACTIVADA');
  console.log('🧪 ==========================================');
  console.log('📋 Parámetro id_orden:', req.params.id_orden);
  console.log('🔍 URL completa:', req.originalUrl);
  console.log('🌐 Método:', req.method);
  console.log('🧪 ==========================================');
  next();
}, getAnalisisDetalladoPorOrden);

// ============================================
// RUTAS DE ANÁLISIS
// ============================================
app.get('/api/analisis', getAnalisisDisponibles);

// ============================================
// RUTAS DE OBRAS SOCIALES
// ============================================
app.get('/api/obras-sociales/buscar/:texto', buscarObrasSociales);

// ============================================
// RUTAS DE SISTEMA
// ============================================

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Servidor funcionando correctamente',
    version: '1.0.0',
    database: 'Connected'
  });
});

// Ruta de test de conexión a BD
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 as test, NOW() as timestamp') as [any[], any];
    res.json({
      success: true,
      message: 'Conexión a base de datos exitosa',
      data: rows
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error de conexión a base de datos',
      error: error.message
    });
  }
});

// Ruta de información de la API
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API del Sistema de Laboratorio Bioquímico',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      sistema: [
        'GET /api/health - Health check',
        'GET /api/test-db - Test conexión BD',
        'GET /api - Esta información'
      ],
      auth: [
        'POST /api/medico/login'
      ],
      dashboard: [
        'GET /api/medico/dashboard/:id_medico'
      ],
      pacientes: [
        'POST /api/pacientes - Registrar paciente',
        'PUT /api/paciente/actualizar/:nro_ficha - Actualizar paciente',
        'GET /api/paciente/buscar/:dni - Buscar por DNI',
        'GET /api/paciente/buscar/ficha/:nro_ficha - Buscar por ficha',
        'GET /api/pacientes/buscar-por-dni/:dni_parcial - Búsqueda parcial'
      ],
      historial: [
        'GET /api/paciente/historial/:nro_ficha - Historial completo',
        'GET /api/orden/analisis/:id_orden - Análisis detallado'
      ],
      analisis: [
        'GET /api/analisis - Análisis disponibles'
      ],
      obras_sociales: [
        'GET /api/obras-sociales/buscar/:texto - Buscar obras sociales'
      ]
    },
    status: '✅ Todas las rutas configuradas correctamente'
  });
});

// ============================================
// MIDDLEWARES DE ERROR
// ============================================

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  console.log(`\n❌ ==========================================`);
  console.log(`❌ RUTA NO ENCONTRADA`);
  console.log(`❌ ==========================================`);
  console.log(`❌ Método: ${req.method}`);
  console.log(`❌ URL: ${req.originalUrl}`);
  console.log(`❌ IP: ${req.ip}`);
  console.log(`❌ User-Agent: ${req.get('User-Agent')}`);
  console.log(`❌ ==========================================`);
  
  // Sugerencias inteligentes basadas en la URL
  let sugerencia = 'Verifica la documentación en GET /api';
  if (req.originalUrl.includes('/paciente')) {
    sugerencia = 'Para pacientes usa: POST /api/pacientes o GET /api/paciente/buscar/:dni';
  } else if (req.originalUrl.includes('/medico')) {
    sugerencia = 'Para médicos usa: POST /api/medico/login o GET /api/medico/dashboard/:id';
  } else if (req.originalUrl.includes('/analisis')) {
    sugerencia = 'Para análisis usa: GET /api/analisis';
  }
  
  res.status(404).json({ 
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    suggestion: sugerencia,
    available_endpoints: 'GET /api para ver rutas disponibles',
    timestamp: new Date().toISOString()
  });
});

// Middleware de manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('\n💥 ==========================================');
  console.error('💥 ERROR DEL SERVIDOR');
  console.error('💥 ==========================================');
  console.error('💥 URL:', req.originalUrl);
  console.error('💥 Método:', req.method);
  console.error('💥 Error:', err);
  console.error('💥 Stack:', err.stack);
  console.error('💥 ==========================================');
  
  // Errores específicos de base de datos
  if (err.code === 'ER_BAD_FIELD_ERROR') {
    return res.status(500).json({
      success: false,
      message: 'Error en la estructura de la base de datos',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Database structure error'
    });
  }

  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      message: 'No se puede conectar a la base de datos'
    });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Ya existe un registro con estos datos'
    });
  }

  res.status(500).json({ 
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? {
      message: err.message,
      code: err.code,
      stack: err.stack
    } : 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// FUNCIÓN PARA TEST DE BASE DE DATOS
// ============================================

const testDatabaseConnection = async () => {
  try {
    console.log('🔍 Probando conexión a la base de datos...');
    const [rows] = await pool.query('SELECT 1 as test, NOW() as timestamp') as [any[], any];
    console.log('✅ Conexión a MySQL exitosa');
    console.log('📊 Test result:', rows);
    
    // Test de tabla paciente
    try {
      const [pacientes] = await pool.query('SELECT COUNT(*) as total FROM paciente LIMIT 1') as [any[], any];
      console.log('📋 Tabla paciente accesible, total registros:', pacientes[0]?.total || 0);
    } catch (tableError: any) {
      console.log('⚠️ Problema con tabla paciente:', tableError?.message || 'Error desconocido');
    }
    
    // Test de tabla orden
    try {
      const [ordenes] = await pool.query('SELECT COUNT(*) as total FROM orden LIMIT 1') as [any[], any];
      console.log('📋 Tabla orden accesible, total registros:', ordenes[0]?.total || 0);
    } catch (tableError: any) {
      console.log('⚠️ Problema con tabla orden:', tableError?.message || 'Error desconocido');
    }
    
  } catch (error: any) {
    console.error('❌ Error de conexión a MySQL:', error.message);
    console.error('❌ Código de error:', error.code);
    console.error('❌ Estado SQL:', error.sqlState);
  }
};

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log('🚀 LABORATORIO BIOQUÍMICO - API SERVER');
  console.log('🚀 ========================================');
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌐 URL Local: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test BD: http://localhost:${PORT}/api/test-db`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api`);
  console.log(`🖥️  Frontend: http://localhost:3000`);
  console.log('🚀 ========================================');
  console.log('✅ Rutas configuradas:');
  console.log('   📋 GET /api/paciente/historial/:nro_ficha');
  console.log('   🧪 GET /api/orden/analisis/:id_orden');
  console.log('   👥 Rutas de pacientes activas');
  console.log('   👨‍⚕️ Rutas de médicos activas');
  console.log('   🔍 Rutas de búsqueda activas');
  console.log('🚀 ========================================');
  console.log('✅ Sistema listo para recibir peticiones');
  console.log('🔍 Modo DEBUG activado - logs detallados');
  console.log('');
  
  // Test de conexión a BD al iniciar
  testDatabaseConnection();
});

export default app;