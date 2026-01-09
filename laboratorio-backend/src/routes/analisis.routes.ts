import { Router } from 'express';
import { getAllAnalisisAdmin, getEstructuraAnalisis } from '../controllers/analisis.controller';

const router = Router();

router.get('/admin/catalogo', getAllAnalisisAdmin);

// ✅ NUEVA RUTA: Debe coincidir con la que llama el frontend
router.get('/estructura/:codigo', getEstructuraAnalisis);

export default router;