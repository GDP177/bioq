// src/routes/medico.routes.ts - RUTAS ACTUALIZADAS COMPLETAS

import { Router } from 'express';
import { loginMedico, getDashboardMedico } from '../controllers/medico.controller';
import { getOrdenesMedico, getOrdenDetalle } from '../controllers/orden.controller';
import { 
  getAnalisisDisponibles, 
  buscarPacientePorDNI, 
  crearNuevaSolicitud,
  getPacientesMedico,
  getAnalisisMedico
} from '../controllers/nuevas-funcionalidades.controller';

const router = Router();

// Rutas de autenticación
router.post('/login', loginMedico);

// Rutas del dashboard
router.get('/dashboard/:id_medico', getDashboardMedico);

// Rutas de órdenes
router.get('/:id_medico/ordenes', getOrdenesMedico);
router.get('/:id_medico/orden/:id_orden', getOrdenDetalle);

// Rutas para nueva solicitud
router.post('/:id_medico/nueva-solicitud', crearNuevaSolicitud);

// Rutas para gestión de pacientes
router.get('/:id_medico/pacientes', getPacientesMedico);

// Rutas para gestión de análisis
router.get('/:id_medico/analisis', getAnalisisMedico);

// Rutas auxiliares
router.get('/analisis', getAnalisisDisponibles); // Para obtener análisis disponibles
router.get('/paciente/buscar/:dni', buscarPacientePorDNI); // Para buscar paciente por DNI

console.log('✅ Rutas de médico cargadas correctamente');

export default router;