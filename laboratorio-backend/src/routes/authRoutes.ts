// laboratorio-backend/src/routes/authRoutes.ts - RUTAS LIMPIAS (THIN LAYER)

import express from "express";
import { 
  loginUnificado, 
  registrarUsuario,
  validarDatosLogin,
  validarDatosRegistro
} from '../controllers/auth.controller';

const router = express.Router();

console.log('🔧 Configurando rutas de autenticación...');

// ============================================
// RUTAS DE AUTENTICACIÓN - SOLO DEFINICIÓN
// ============================================

// Registro de usuario (con validación opcional)
router.post("/register", validarDatosRegistro, registrarUsuario);

// Login unificado (con validación opcional) 
router.post("/login", validarDatosLogin, loginUnificado);

// ============================================
// MIDDLEWARE DE LOGGING (OPCIONAL)
// ============================================
router.use((req, res, next) => {
  console.log(`🔐 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

console.log('✅ Rutas de autenticación configuradas:');
console.log('   📝 POST /api/register - Registro unificado');
console.log('   🔐 POST /api/login - Login unificado');

export default router;