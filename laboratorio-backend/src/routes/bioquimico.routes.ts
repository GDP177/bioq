// laboratorio-backend/src/routes/bioquimico.routes.ts

import { Router } from 'express';
import { 
  completarPerfilBioquimico, 
  getDashboardBioquimico, 
  getOrdenesBioquimico,
  procesarOrden,
  cargarResultado,
  getDetalleOrden
} from '../controllers/bioquimico.controller';

const router = Router();

console.log('🔄 Cargando rutas de bioquímico...');

// ============================================
// RUTAS DE PERFIL
// ============================================
router.post('/completar-perfil', completarPerfilBioquimico);

// ============================================
// RUTAS DEL DASHBOARD
// ============================================
router.get('/dashboard/:matricula_profesional', getDashboardBioquimico);

// ============================================
// RUTAS DE ÓRDENES
// ============================================
router.get('/ordenes', getOrdenesBioquimico);
router.get('/orden/:id_orden', getDetalleOrden);
router.patch('/orden/:id_orden/procesar', procesarOrden);

// ============================================
// RUTAS DE ANÁLISIS Y RESULTADOS
// ============================================
router.post('/analisis/:id_orden_analisis/resultado', cargarResultado);

// ============================================
// MIDDLEWARE DE LOGGING
// ============================================
router.use((req, res, next) => {
  console.log(`🧬 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  console.log('──────────────────────────────');
  next();
});

console.log('✅ Rutas de bioquímico cargadas correctamente');
console.log('📋 Rutas disponibles:');
console.log('   - POST /bioquimico/completar-perfil');
console.log('   - GET /bioquimico/dashboard/:matricula_profesional');
console.log('   - GET /bioquimico/ordenes');
console.log('   - GET /bioquimico/orden/:id_orden');
console.log('   - PATCH /bioquimico/orden/:id_orden/procesar');
console.log('   - POST /bioquimico/analisis/:id_orden_analisis/resultado');

export default router;