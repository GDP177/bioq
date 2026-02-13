// src/routes/analisis.routes.ts

import { Router } from 'express';
import { 
    getAllAnalisisAdmin, 
    guardarAnalisis, 
    updateAnalisis, // <--- Importamos la nueva función
    getAnalisisMedico,
    getTiposAnalisis,
    getAnalisisDisponibles,
    actualizarReferenciaCatalogo,
    getEstructuraAnalisis,
    getCatalogoAnalisis,
    getHijosAnalisis
} from '../controllers/analisis.controller';

const router = Router();

// ==========================================
// 1. RUTAS DE ADMINISTRADOR
// ==========================================
router.get('/admin/catalogo', getAllAnalisisAdmin);

// ✅ RUTA NUEVA: Permite editar una práctica completa por su código
router.put('/:codigo', updateAnalisis);


// ==========================================
// 2. RUTAS DE CATÁLOGO (Para el Selector de Orden)
// ==========================================
router.get('/catalogo', getCatalogoAnalisis);
router.get('/:codigo/hijos', getHijosAnalisis);


// ==========================================
// 3. OTRAS RUTAS
// ==========================================
router.get('/', getAllAnalisisAdmin);
router.post('/', guardarAnalisis);
router.get('/medico/:id_medico', getAnalisisMedico);
router.get('/tipos', getTiposAnalisis);
router.get('/disponibles', getAnalisisDisponibles);
router.put('/:codigo_practica/referencia', actualizarReferenciaCatalogo);
router.get('/:codigo/estructura', getEstructuraAnalisis);

export default router;