// src/index.ts - SERVIDOR PRINCIPAL CON TODAS LAS RUTAS

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

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
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

// Ruta de información de la API
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API del Sistema de Laboratorio Bioquímico',
    version: '1.0.0',
    endpoints: {
      auth: [
        'POST /api/medico/login'
      ],
      dashboard: [
        'GET /api/medico/dashboard/:id_medico'
      ],
      ordenes: [
        'GET /api/medico/:id_medico/ordenes',
        'GET /api/medico/:id_medico/orden/:id_orden',
        'POST /api/medico/:id_medico/nueva-solicitud'
      ],
      pacientes: [
        'POST /api/pacientes',
        'POST /api/paciente/registrar',
        'PUT /api/paciente/actualizar/:nro_ficha',
        'GET /api/paciente/buscar/:dni',
        'GET /api/paciente/buscar/ficha/:nro_ficha',
        'GET /api/pacientes/buscar-por-dni/:dni_parcial',
        'GET /api/medico/:id_medico/pacientes'
      ],
      analisis: [
        'GET /api/analisis',
        'GET /api/medico/:id_medico/analisis'
      ],
      obras_sociales: [
        'GET /api/obras-sociales/buscar/:texto'
      ],
      system: [
        'GET /api/health',
        'GET /api'
      ]
    },
    database_structure: {
      paciente: {
        columns: [
          'nro_ficha (PK)', 'Nombre_paciente', 'Apellido_paciente', 
          'fecha_alta', 'fecha_nacimiento', 'edad', 'sexo', 'estado',
          'mutual', 'nro_afiliado', 'grupo_sanguineo', 'DNI', 
          'CP', 'direccion', 'telefono'
        ]
      }
    },
    new_features: [
      'Registro exitoso de pacientes con redirección',
      'Edición completa de pacientes con validaciones',
      'Búsqueda por número de ficha',
      'Página de confirmación de registro',
      'Formulario de edición con datos precargados',
      'Navegación mejorada entre módulos'
    ]
  });
});

// Ruta por defecto
app.get('/', (req, res) => {
  res.json({ 
    message: '🏥 Sistema de Laboratorio Bioquímico',
    version: '1.0.0',
    status: 'Servidor activo',
    documentation: 'GET /api para ver endpoints disponibles',
    admin_panel: 'http://localhost:3000',
    api_status: 'http://localhost:5000/api/health',
    features: [
      '✅ Registro de pacientes',
      '✅ Edición completa de pacientes',
      '✅ Gestión de obras sociales',
      '✅ Búsqueda por DNI y ficha',
      '✅ Sistema de confirmación',
      '✅ Validaciones robustas',
      '🚧 Historial médico (próximamente)'
    ]
  });
});

// ============================================
// MIDDLEWARES DE ERROR
// ============================================

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  console.log(`❌ Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  
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
    available_endpoints: 'GET /api para ver rutas disponibles'
  });
});

// Middleware de manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('💥 Error del servidor:', err);
  
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
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// ============================================
// FUNCIÓN PARA TEST DE BASE DE DATOS
// ============================================

const testDatabaseConnection = async () => {
  try {
    await pool.query('SELECT 1 as test');
    console.log('✅ Conexión a MySQL exitosa');
  } catch (error: any) {
    console.error('❌ Error de conexión a MySQL:', error.message);
  }
};

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
  console.log('🚀 ========================================');
  console.log('🚀 LABORATORIO BIOQUÍMICO - API SERVER');
  console.log('🚀 ========================================');
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api`);
  console.log(`🖥️  Frontend: http://localhost:3000`);
  console.log('🚀 ========================================');
  console.log('✅ Funcionalidades disponibles:');
  console.log('   • Registro de pacientes');
  console.log('   • Edición completa de pacientes');
  console.log('   • Búsqueda por DNI y ficha');
  console.log('   • Gestión de obras sociales');
  console.log('   • Sistema de confirmación');
  console.log('   • Validaciones robustas');
  console.log('🚀 ========================================');
  console.log('✅ Sistema listo para recibir peticiones');
  console.log('');
  
  // Test de conexión a BD al iniciar
  testDatabaseConnection();
});

export default app;