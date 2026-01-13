// laboratorio-backend/src/routes/admin.routes.ts

import { Router } from 'express';
// Importamos el middleware de verificación de rol
import { verificarRol } from '../middleware/auth.middleware'; 
import { 
  getDashboardAdmin, 
  getAllPacientesAdmin, 
  getAllUsuariosAdmin 
} from '../controllers/admin.controller';
// ✅ Importación crucial para corregir el ReferenceError
import { getUsuarios, updateUsuario, createUsuario, resetPassword } from '../controllers/usuario.controller';

import { getAllAnalisisAdmin } from '../controllers/analisis.controller';



const router = Router();

console.log('🔄 Cargando rutas de administrador...');

// ==========================================================
// MIDDLEWARE DE LOGGING (MOVIDO AL INICIO)
// ==========================================================
// Moverlo aquí arriba permite ver por qué fallan las peticiones 
// antes de que el middleware de rol las bloquee.
router.use((req, res, next) => {
  console.log(`👑 ${new Date().toISOString()} - [ADMIN-ROUTE-HIT] ${req.method} ${req.originalUrl}`);
  console.log('──────────────────────────────');
  next();
});

// ==========================================================
// APLICAR MIDDLEWARE DE SEGURIDAD A TODAS LAS RUTAS DE ADMIN
// ==========================================================
// Esta línea asegura que solo usuarios con el rol 'admin'
// puedan acceder a CUALQUIER ruta definida en este archivo.
router.use(verificarRol(['admin']));


// ============================================
// RUTAS DEL DASHBOARD
// ============================================
// IMPORTANTE: El parámetro se llama :id_usuario. 
// El frontend debe enviar un número limpio aquí.
router.get('/dashboard/:id_usuario', getDashboardAdmin);

// ============================================
// RUTAS DE GESTIÓN DE PACIENTES
// ============================================
router.get('/pacientes', getAllPacientesAdmin);

// ============================================
// RUTAS DE GESTIÓN DE USUARIOS
// ============================================
router.get('/usuarios', getAllUsuariosAdmin);

router.post('/usuarios/reset-password/:id', resetPassword);
router.post('/usuarios', createUsuario);
router.put('/usuarios/:id', updateUsuario);


console.log('✅ Rutas de administrador cargadas y protegidas correctamente');

export default router;