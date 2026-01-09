import { Router } from 'express';
import { 
    registrarNuevoPaciente, 
    actualizarPaciente, 
    buscarPacientePorDNI, 
    buscarPacientePorFicha, 
    buscarObrasSociales, 
    buscarPacientesPorDNIParcial,
    buscarPaciente,
    getSugerencias
} from '../controllers/paciente.controller';

const router = Router();

// Registro y Actualización
router.post('/registrar', registrarNuevoPaciente);
router.put('/actualizar/:nro_ficha', actualizarPaciente);

// Búsquedas
router.get('/ficha/:nro_ficha', buscarPacientePorFicha);
router.get('/dni/:dni', buscarPacientePorDNI);
router.get('/buscar-dni/:dni_parcial', buscarPacientesPorDNIParcial);
router.get('/obras-sociales/:texto', buscarObrasSociales);

// Estas rutas deben coincidir con las llamadas del frontend
router.get('/buscar/:dni', buscarPaciente);
router.get('/buscar-por-dni/:dni', getSugerencias);

export default router;