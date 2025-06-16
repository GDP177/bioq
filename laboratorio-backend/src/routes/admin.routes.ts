// laboratorio-backend/src/routes/admin.routes.ts

import { Router } from 'express';
import { 
  getDashboardAdmin, 
  getAllPacientesAdmin, 
  getAllUsuariosAdmin 
} from '../controllers/admin.controller';

const router = Router();

console.log('🔄 Cargando rutas de administrador...');

// ============================================
// RUTAS DEL DASHBOARD
// ============================================
router.get('/dashboard/:id_usuario', getDashboardAdmin);

// ============================================
// RUTAS DE GESTIÓN DE PACIENTES
// ============================================
router.get('/pacientes', getAllPacientesAdmin);

// ============================================
// RUTAS DE GESTIÓN DE USUARIOS
// ============================================
router.get('/usuarios', getAllUsuariosAdmin);

// ============================================
// MIDDLEWARE DE LOGGING
// ============================================
router.use((req, res, next) => {
  console.log(`👑 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  console.log('──────────────────────────────');
  next();
});

console.log('✅ Rutas de administrador cargadas correctamente');
console.log('📋 Rutas disponibles:');
console.log('   - GET /admin/dashboard/:id_usuario');
console.log('   - GET /admin/pacientes');
console.log('   - GET /admin/usuarios');

export default router;