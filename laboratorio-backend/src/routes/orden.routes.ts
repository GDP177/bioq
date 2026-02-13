// src/routes/orden.routes.ts

import { Router } from 'express';
import ordenController from '../controllers/orden.controller';

const router = Router();

// ==========================================
// 1. RUTAS ESTÁTICAS (VAN PRIMERO)
// ==========================================

// Catálogo
router.get('/catalogo', ordenController.getCatalogo);

// ✅ ESTA RUTA DEBE IR ANTES QUE /:id_orden
// Si la pones después, el sistema cree que "pendientes" es un ID y falla.
router.get('/pendientes', ordenController.getOrdenesPendientes);


// ==========================================
// 2. RUTAS DINÁMICAS (VAN DESPUÉS)
// ==========================================

// Crear Orden
router.post('/', ordenController.crearNuevaOrden);

// Listado Médico
router.get('/medico/:id_medico', ordenController.getOrdenesMedico);
router.put('/:id_orden/finalizar', ordenController.finalizarOrden);
router.put('/:id_orden/analisis/:codigo_practica', ordenController.guardarResultadoAnalisis);
// Detalle de Orden (Captura cualquier ID, por eso va al final)
router.get('/:id_orden', ordenController.getOrdenDetalle);

export default router;