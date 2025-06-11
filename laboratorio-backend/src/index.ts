// src/index.ts - SERVIDOR PRINCIPAL REORGANIZADO

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importar rutas
import medicoRoutes from './routes/medico.routes';

// Importar controladores específicos
import { 
  registrarNuevoPaciente,
  buscarPacientePorDNI,
  buscarObrasSociales,
  buscarPacientesPorDNIParcial
} from './controllers/paciente.controller';

import { 
  getAnalisisDisponibles
} from './controllers/nuevas-funcionalidades.controller';

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

// ⚠️ RUTAS PARA COMPATIBILIDAD CON EL FRONTEND
app.post('/api/pacientes', registrarNuevoPaciente);                        // ← Principal para frontend
app.post('/api/paciente/registrar', registrarNuevoPaciente);               // ← Compatibilidad
app.get('/api/paciente/buscar/:dni', buscarPacientePorDNI);               // ← Buscar por DNI completo
app.get('/api/pacientes/buscar-por-dni/:dni_parcial', buscarPacientesPorDNIParcial); // ← Autocompletado

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
        'POST /api/pacientes',                                    // ← Registro de pacientes
        'POST /api/paciente/registrar',                          // ← Alias para compatibilidad
        'GET /api/paciente/buscar/:dni',                         // ← Buscar por DNI completo
        'GET /api/pacientes/buscar-por-dni/:dni_parcial',        // ← Autocompletado por DNI
        'GET /api/medico/:id_medico/pacientes'                   // ← Pacientes del médico
      ],
      analisis: [
        'GET /api/analisis',                                     // ← Análisis disponibles
        'GET /api/medico/:id_medico/analisis'                    // ← Análisis del médico
      ],
      obras_sociales: [
        'GET /api/obras-sociales/buscar/:texto'                  // ← Autocompletado obras sociales
      ],
      system: [
        'GET /api/health',                                       // ← Estado del servidor
        'GET /api'                                               // ← Esta documentación
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
    }
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
    api_status: 'http://localhost:5000/api/health'
  });
});

// ============================================
// MIDDLEWARES DE ERROR
// ============================================

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  console.log(`❌ Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    available_endpoints: 'GET /api para ver rutas disponibles',
    suggestion: req.originalUrl.includes('/paciente') ? 
      'Para pacientes usa: POST /api/pacientes' : 
      'Verifica la documentación en GET /api'
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

  res.status(500).json({ 
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

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
  console.log('✅ Sistema listo para recibir peticiones');
  console.log('');
  
  // Test de conexión a BD al iniciar
  import('./routes/db').then(({ pool }) => {
    pool.query('SELECT 1 as test')
      .then(() => console.log('✅ Conexión a MySQL exitosa'))
      .catch((err) => console.error('❌ Error de conexión a MySQL:', err.message));
  });
});

export default app;