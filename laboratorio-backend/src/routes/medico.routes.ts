// src/routes/medico.routes.ts - RUTAS COMPLETAS Y CORREGIDAS

import { Router } from 'express';
import { loginMedico, getDashboardMedico } from '../controllers/medico.controller';
import { getOrdenesMedico, getOrdenDetalle, crearNuevaOrden } from '../controllers/orden.controller';
import { getAnalisisMedico, getTiposAnalisis, getAnalisisDisponibles } from '../controllers/analisis.controller';
import { 
  buscarPacientePorDNI, 
  buscarPacientesPorDNIParcial,
  buscarObrasSociales,
  registrarNuevoPaciente
} from '../controllers/nuevas-funcionalidades.controller';
import { 
  buscarPacientePorFicha,
  actualizarPaciente
} from '../controllers/paciente.controller';

const router = Router();

console.log('🔄 Cargando rutas de médico...');

// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================
router.post('/login', loginMedico);

// ============================================
// RUTAS DEL DASHBOARD
// ============================================
router.get('/dashboard/:id_medico', getDashboardMedico);

// ============================================
// RUTAS DE ÓRDENES
// ============================================
router.get('/:id_medico/ordenes', getOrdenesMedico);
router.get('/:id_medico/orden/:id_orden', getOrdenDetalle);
router.post('/:id_medico/nueva-orden', crearNuevaOrden);

// ============================================
// RUTAS DE ANÁLISIS
// ============================================
router.get('/:id_medico/analisis', getAnalisisMedico);
router.get('/tipos-analisis', getTiposAnalisis);
router.get('/analisis-disponibles', getAnalisisDisponibles);

// ============================================
// RUTAS DE PACIENTES
// ============================================
// Búsqueda de pacientes
router.get('/paciente/buscar-dni/:dni', buscarPacientePorDNI);
router.get('/paciente/buscar-ficha/:nro_ficha', buscarPacientePorFicha);
router.get('/paciente/buscar-dni-parcial/:dni_parcial', buscarPacientesPorDNIParcial);

// Gestión de pacientes
router.post('/paciente/registrar', registrarNuevoPaciente);
router.put('/paciente/actualizar/:nro_ficha', actualizarPaciente);

// ============================================
// RUTAS AUXILIARES
// ============================================
router.get('/obras-sociales/buscar/:texto', buscarObrasSociales);

// ============================================
// MIDDLEWARE DE LOGGING
// ============================================
router.use((req, res, next) => {
  console.log(`🌐 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  console.log('──────────────────────────────');
  next();
});

console.log('✅ Rutas de médico cargadas correctamente');
console.log('📋 Rutas disponibles:');
console.log('   - POST /medico/login');
console.log('   - GET /medico/dashboard/:id_medico');
console.log('   - GET /medico/:id_medico/ordenes');
console.log('   - GET /medico/:id_medico/orden/:id_orden');
console.log('   - POST /medico/:id_medico/nueva-orden');
console.log('   - GET /medico/:id_medico/analisis');
console.log('   - GET /medico/tipos-analisis');
console.log('   - GET /medico/analisis-disponibles');
console.log('   - GET /medico/paciente/buscar-dni/:dni');
console.log('   - GET /medico/paciente/buscar-ficha/:nro_ficha');
console.log('   - GET /medico/paciente/buscar-dni-parcial/:dni_parcial');
console.log('   - POST /medico/paciente/registrar');
console.log('   - PUT /medico/paciente/actualizar/:nro_ficha');
console.log('   - GET /medico/obras-sociales/buscar/:texto');

export default router;