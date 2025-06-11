// src/index.ts - SERVIDOR PRINCIPAL CORREGIDO

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importar rutas
import medicoRoutes from './routes/medico.routes';
import { getAnalisisDisponibles, buscarPacientePorDNI, buscarPacientesPorDNIParcial } from './controllers/nuevas-funcionalidades.controller';

// Configurar dotenv
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
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

// Rutas
app.use('/api/medico', medicoRoutes);
app.get('/api/analisis', getAnalisisDisponibles);
app.get('/api/paciente/buscar/:dni', buscarPacientePorDNI);
app.get('/api/pacientes/buscar-por-dni/:dni_parcial', buscarPacientesPorDNIParcial);

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Servidor funcionando correctamente' 
  });
});

// Ruta por defecto
app.get('/', (req, res) => {
  res.json({ 
    message: 'API del Sistema de Laboratorio Bioquímico',
    version: '1.0.0',
    endpoints: [
      'POST /api/medico/login',
      'GET /api/medico/dashboard/:id_medico',
      'GET /api/medico/:id_medico/ordenes',
      'GET /api/medico/:id_medico/orden/:id_orden',
      'GET /api/health'
    ]
  });
});

// Middleware de manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('💥 Error del servidor:', err);
  res.status(500).json({ 
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 Servidor iniciado correctamente');
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log('✅ Sistema listo para recibir peticiones');
});

export default app;