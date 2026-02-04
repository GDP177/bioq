// src/routes/admin.routes.ts

import { Router } from 'express';
import { verificarRol } from '../middleware/auth.middleware'; 
import { 
  getDashboardAdmin, 
  getAllUsuariosAdmin 
} from '../controllers/admin.controller';
import { 
    getAllPacientes 
} from '../controllers/paciente.controller'; // Importación corregida
import { 
    getUsuarios, 
    updateUsuario, 
    createUsuario, 
    resetPassword 
} from '../controllers/usuario.controller';
import { getAllAnalisisAdmin } from '../controllers/analisis.controller';

const router = Router();

console.log('🔄 Cargando rutas de administrador...');

// Middleware de Logging
router.use((req, res, next) => {
  console.log(`👑 [ADMIN] ${req.method} ${req.originalUrl}`);
  next();
});

// Middleware de Seguridad (Solo Admins)
router.use(verificarRol(['admin']));

// --- DASHBOARD ---
router.get('/dashboard/:id_usuario', getDashboardAdmin);

// --- GESTIÓN DE PACIENTES ---
router.get('/pacientes', getAllPacientes);

// --- GESTIÓN DE USUARIOS ---
router.get('/usuarios', getAllUsuariosAdmin); 
router.post('/usuarios', createUsuario);
router.put('/usuarios/:id', updateUsuario);
router.post('/usuarios/reset-password/:id', resetPassword);

// --- GESTIÓN DE ANÁLISIS ---
router.get('/analisis', getAllAnalisisAdmin);

console.log('✅ Rutas de administrador cargadas.');

export default router;