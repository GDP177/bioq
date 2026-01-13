// src/routes/medico.routes.ts - CORREGIDO

import { Router } from 'express';
import { 
    loginMedico, 
    getDashboardMedico, 
    completarPerfilMedico,
    getOrdenDetalle // 👈 AHORA LO IMPORTAMOS DESDE AQUÍ (donde está el fix)
} from '../controllers/medico.controller';

import { 
    getOrdenesMedico, 
    crearNuevaOrden 
} from '../controllers/orden.controller';

import { 
    getAnalisisMedico, 
    getTiposAnalisis, 
    getAnalisisDisponibles 
} from '../controllers/analisis.controller';

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

// ============================================
// 1. MIDDLEWARE DE LOGGING
// ============================================
router.use((req, res, next) => {
    console.log(`👨‍⚕️ [MEDICO-ROUTE] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

console.log('🔄 Cargando rutas de médico...');

// ============================================
// RUTAS DE AUTENTICACIÓN Y PERFIL
// ============================================
router.post('/login', loginMedico);
router.post('/completar-perfil', completarPerfilMedico);

// ============================================
// RUTAS DEL DASHBOARD
// ============================================
router.get('/dashboard/:id_medico', getDashboardMedico);

// ============================================
// RUTAS DE ÓRDENES / SOLICITUDES
// ============================================
router.get('/:id_medico/ordenes', getOrdenesMedico);

// ✅ RUTA DE CREACIÓN (Coincide con NuevaSolicitud.tsx)
router.post('/:id_medico/nueva-solicitud', crearNuevaOrden); 

// ✅ RUTA DE DETALLE (Usando el controlador corregido que trae nombres)
router.get('/orden/:id_orden', getOrdenDetalle); 
// (Nota: Eliminé la ruta duplicada /:id_medico/orden/:id_orden para evitar confusión)

// ============================================
// RUTAS DE ANÁLISIS
// ============================================
router.get('/:id_medico/analisis', getAnalisisMedico);
router.get('/tipos-analisis', getTiposAnalisis);
router.get('/analisis-disponibles', getAnalisisDisponibles);

// ============================================
// RUTAS DE PACIENTES
// ============================================
router.get('/paciente/buscar/:dni', buscarPacientePorDNI);
router.get('/paciente/ficha/:nro_ficha', buscarPacientePorFicha);
router.get('/paciente/buscar-dni-parcial/:dni_parcial', buscarPacientesPorDNIParcial);

router.post('/paciente/registrar', registrarNuevoPaciente);
router.put('/paciente/actualizar/:nro_ficha', actualizarPaciente);

// ============================================
// RUTAS AUXILIARES
// ============================================
router.get('/obras-sociales/buscar/:texto', buscarObrasSociales);

console.log('✅ Rutas de médico cargadas correctamente');

export default router;