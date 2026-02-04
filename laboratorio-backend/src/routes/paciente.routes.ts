import { Router } from 'express';
import { 
    registrarNuevoPaciente, 
    actualizarPaciente, 
    buscarPacientePorFicha,
    buscarPacientesSugeridos, 
    buscarObrasSociales,
    getAllPacientes // <--- 1. IMPORTANTE: Importar la nueva función
} from '../controllers/paciente.controller';

const router = Router();

// ==========================================
// RUTAS DE BÚSQUEDA Y LISTADO
// ==========================================

// 2. IMPORTANTE: Agregar esta ruta raíz que faltaba
// Esta maneja GET /api/pacientes (gracias a index.ts)
router.get('/', getAllPacientes); 

// Búsqueda en tiempo real (dropdown del buscador)
router.get('/buscar-por-dni/:dni', buscarPacientesSugeridos);

// Obtener detalles completos de un paciente (para el Modal)
router.get('/ficha/:nro_ficha', buscarPacientePorFicha);

// Búsqueda de obras sociales
router.get('/obras-sociales/:texto', buscarObrasSociales);

// ==========================================
// RUTAS DE GESTIÓN (CRUD)
// ==========================================

// Registrar nuevo paciente
router.post('/registrar', registrarNuevoPaciente);

// Actualizar paciente existente
router.put('/:nro_ficha', actualizarPaciente);

export default router;