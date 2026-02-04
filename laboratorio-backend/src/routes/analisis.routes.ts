// src/routes/analisis.routes.ts

import { Router } from 'express';
import { 
    getAllAnalisisAdmin, 
    guardarAnalisis, 
    getAnalisisMedico,
    getTiposAnalisis,
    getAnalisisDisponibles,
    actualizarReferenciaCatalogo,
    getEstructuraAnalisis,
    // 👇 IMPORTANTE: Importamos las nuevas funciones que creamos
    getCatalogoAnalisis,
    getHijosAnalisis
} from '../controllers/analisis.controller';

const router = Router();

// ==========================================
// RUTAS DE CATÁLOGO (Para el Selector)
// ==========================================

// GET /api/analisis/catalogo
router.get('/catalogo', getCatalogoAnalisis);

// GET /api/analisis/:codigo/hijos
router.get('/:codigo/hijos', getHijosAnalisis);


// ==========================================
// RUTAS EXISTENTES (Admin / Médico)
// ==========================================
router.get('/', getAllAnalisisAdmin); // Para dashboard admin
router.post('/', guardarAnalisis);
router.get('/medico/:id_medico', getAnalisisMedico);
router.get('/tipos', getTiposAnalisis);
router.get('/disponibles', getAnalisisDisponibles);
router.put('/:codigo_practica/referencia', actualizarReferenciaCatalogo);
router.get('/:codigo/estructura', getEstructuraAnalisis);

export default router;