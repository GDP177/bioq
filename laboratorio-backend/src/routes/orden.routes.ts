// C:\Users\che-g\Desktop\BQ\laboratorio-backend\src\routes\orden.routes.ts

import { Router } from 'express';
import { 
    getCatalogo, 
    registrarOrden,
    getOrdenesMedico,
    getOrdenDetalle
} from '../controllers/orden.controller';

const router = Router();

// ✅ CAMBIO: Ruta neutral accesible para el Médico
// Al no tener el prefijo /admin, no chocará con el middleware de administrador
router.get('/catalogo-analisis', getCatalogo); 

// Gestión de órdenes (donde el médico inserta en la tabla 'orden' y 'orden_analisis')
router.post('/medico/:id/nueva-solicitud', registrarOrden);
router.get('/medico/:id_medico/ordenes', getOrdenesMedico);
router.get('/medico/:id_medico/orden/:id_orden', getOrdenDetalle);

export default router;