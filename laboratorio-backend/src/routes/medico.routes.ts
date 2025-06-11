// src/routes/medico.routes.ts
import { Router } from 'express';
import { loginMedico, getDashboardMedico } from '../controllers/medico.controller';

const router = Router();

router.post('/login', loginMedico);
router.get('/dashboard/:id_medico', getDashboardMedico);

console.log('✅ Rutas de médico cargadas correctamente');

export default router;
