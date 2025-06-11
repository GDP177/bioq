// src/routes/medico.routes.ts - RUTAS ACTUALIZADAS

import { Router } from 'express';
import { loginMedico, getDashboardMedico } from '../controllers/medico.controller';
import { getOrdenesMedico, getOrdenDetalle } from '../controllers/orden.controller';

const router = Router();

// Rutas de autenticación
router.post('/login', loginMedico);

// Rutas del dashboard
router.get('/dashboard/:id_medico', getDashboardMedico);

// Rutas de órdenes
router.get('/:id_medico/ordenes', getOrdenesMedico);
router.get('/:id_medico/orden/:id_orden', getOrdenDetalle);

console.log('✅ Rutas de médico cargadas correctamente');

export default router;