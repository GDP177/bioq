import { Router } from 'express';
import { 
    registrarNuevoPaciente, 
    actualizarPaciente, 
    buscarPacientePorFicha,
    buscarPacientesSugeridos, // Usaremos esta para la búsqueda en tiempo real
    buscarObrasSociales
} from '../controllers/paciente.controller';

const router = Router();

// ==========================================
// 1. RUTAS ESPECÍFICAS (Orden importante)
// ==========================================

// Búsqueda en tiempo real (dropdown del buscador)
router.get('/buscar-por-dni/:dni', buscarPacientesSugeridos);

// Obtener detalles completos de un paciente (para el Modal)
router.get('/ficha/:nro_ficha', buscarPacientePorFicha);

// Búsqueda de obras sociales
router.get('/obras-sociales/:texto', buscarObrasSociales);

// ==========================================
// 2. RUTAS DE GESTIÓN (CRUD)
// ==========================================

// Registrar nuevo paciente
router.post('/registrar', registrarNuevoPaciente);

// Actualizar paciente existente
router.put('/:nro_ficha', actualizarPaciente);

export default router;