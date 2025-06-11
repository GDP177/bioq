import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importar rutas
import authRoutes from './routes/authRoutes';
import medicoRoutes from './routes/medico.routes';
import ordenRoutes from './routes/orden.routes';
import bioquimicoRoutes from './routes/bioquimico';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Puertos comunes de Vite y React
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging para desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/login', authRoutes); // Ruta adicional para compatibilidad
app.use('/api/medico', medicoRoutes);
app.use('/api/ordenes', ordenRoutes);
app.use('/api/bioquimico', bioquimicoRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Servidor del laboratorio funcionando correctamente!', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({ message: `Ruta ${req.originalUrl} no encontrada` });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 Salud del servidor: http://localhost:${PORT}/api/health`);
  console.log(`🏥 API del laboratorio lista en: http://localhost:${PORT}/api`);
});