import { Router } from 'express';
import { 
    getCatalogo, 
    registrarOrden,
    getOrdenesMedico,
    getOrdenDetalle
} from '../controllers/orden.controller';

const router = Router();

// Catálogo de análisis (Carga la lista de prácticas)
router.get('/admin/analisis', getCatalogo); 

// Gestión de órdenes
router.post('/medico/:id/nueva-solicitud', registrarOrden);
router.get('/medico/:id_medico/ordenes', getOrdenesMedico);
router.get('/medico/:id_medico/orden/:id_orden', getOrdenDetalle);

export default router;