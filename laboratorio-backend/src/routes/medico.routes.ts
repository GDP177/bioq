// src/routes/medico.routes.ts - CORREGIDO

import { Router } from 'express';
import { 
    loginMedico, 
    getDashboardMedico, 
    completarPerfilMedico,
    getOrdenDetalle, 
    crearSolicitudMedica,
    modificarSolicitudMedica // ✅ NUEVO: Importamos la función para modificar
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

// ✅ RUTA DE CREACIÓN (Corregida en el paso anterior)
router.post('/:id_medico/nueva-solicitud', crearSolicitudMedica); 

// ✅ RUTA DE DETALLE (Para cargar la vista con todos los datos)
router.get('/orden/:id_orden', getOrdenDetalle); 

// ✅ RUTA DE MODIFICACIÓN (NUEVA: Para editar la orden enviada)
router.put('/orden/:id_orden', modificarSolicitudMedica);

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