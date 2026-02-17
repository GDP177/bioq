// src/routes/authRoutes.ts

import express from "express";
import { 
  loginUnificado, 
  registrarUsuario,
  validarDatosLogin,
  validarDatosRegistro
} from '../controllers/auth.controller';

// Importamos el controlador de usuarios que contiene updateUserProfile
import usuarioController from '../controllers/usuario.controller';

const router = express.Router();

console.log('🔧 Configurando rutas de autenticación...');

// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================

// Registro de usuario
router.post("/register", validarDatosRegistro, registrarUsuario);

// Login unificado
router.post("/login", validarDatosLogin, loginUnificado);

// ============================================
// RUTAS DE GESTIÓN DE PERFIL (NUEVO)
// ============================================
// Esta ruta permite a cualquier usuario logueado actualizar sus propios datos
router.put("/perfil/actualizar", usuarioController.updateUserProfile);

// ============================================
// MIDDLEWARE DE LOGGING
// ============================================
router.use((req, res, next) => {
  console.log(`🔐 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

console.log('✅ Rutas de autenticación configuradas.');

export default router;