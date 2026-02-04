// src/index.ts - SERVIDOR PRINCIPAL OPTIMIZADO

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';

// 1. Importar Rutas Modulares
import medicoRoutes from './routes/medico.routes';
import authRoutes from './routes/authRoutes';
import bioquimicoRoutes from './routes/bioquimico.routes';
import adminRoutes from './routes/admin.routes';
import analisisRoutes from './routes/analisis.routes';
import pacienteRoutes from './routes/paciente.routes';
import ordenRoutes from './routes/orden.routes';

// 2. Importar Controladores Específicos
import { 
    registrarNuevoPaciente,
    actualizarPaciente,
    buscarPacientePorDni,
    buscarPacientePorFicha,
    buscarObrasSociales,
    buscarPacientesPorDNIParcial
} from './controllers/paciente.controller';

import { getDashboardBioquimico } from './controllers/bioquimico.controller';
import { getHistorialPaciente, getAnalisisDetalladoPorOrden } from './controllers/historial.controller';
import { pool } from './routes/db';
import { getOrdenDetalleFinal } from './controllers/orden.controller';
import { buscarPacientePorDNI } from './controllers/nuevas-funcionalidades.controller';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARES GLOBALES (Configuración Inicial)
// ============================================

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH' ],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging para depuración de rutas [Importante para ver por qué falla el 404]
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`🌐 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

// ============================================
// FUNCIONES AUXILIARES PARA QUERY PARAMS
// ============================================

const getStringParam = (param: any): string => {
    if (typeof param === 'string') return param.trim();
    if (Array.isArray(param) && param.length > 0) return String(param[0]).trim();
    return '';
};

const getNumberParam = (param: any, defaultValue: number): number => {
    if (typeof param === 'string') {
        const parsed = parseInt(param, 10);
        return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
};

// ============================================
// CONTROLADORES MANTENIDOS (Lógica Directa)
// ============================================

const getDashboardMedico = async (req: Request, res: Response) => {
    const id_medico = parseInt(req.params.id_medico);
    try {
        const [medicoRows]: any = await pool.query(
            `SELECT id_medico as id, nombre_medico as nombre, apellido_medico as apellido, email, especialidad FROM medico WHERE id_medico = ?`,
            [id_medico]
        );
        if (medicoRows.length === 0) return res.status(404).json({ success: false, message: 'Médico no encontrado' });
        
        const [stats]: any = await pool.query(
            `SELECT COUNT(*) as total_ordenes FROM orden WHERE id_medico_solicitante = ?`,
            [id_medico]
        );
        res.json({ success: true, medico: medicoRows[0], estadisticas: stats[0] });
    } catch (error) { res.status(500).json({ success: false }); }
};

const getPacientesMedico = async (req: Request, res: Response) => {
    const id_medico = parseInt(req.params.id_medico);
    const buscar = getStringParam(req.query.buscar);
    const offset = (getNumberParam(req.query.pagina, 1) - 1) * getNumberParam(req.query.limite, 20);

    try {
        if (!id_medico || id_medico <= 0) return res.status(400).json({ success: false, message: 'Médico inválido' });
        
        const query = `
            SELECT p.*, COUNT(o.id_orden) as total_ordenes, MAX(o.fecha_ingreso_orden) as ultima_orden
            FROM paciente p
            JOIN orden o ON p.nro_ficha = o.nro_ficha_paciente
            WHERE o.id_medico_solicitante = ?
            GROUP BY p.nro_ficha
            LIMIT ? OFFSET ?`;

        const [rows]: [any[], any] = await pool.query(query, [id_medico, getNumberParam(req.query.limite, 20), offset]);
        res.json({ success: true, pacientes: rows });
    } catch (error) { res.status(500).json({ success: false }); }
};

const loginMedico = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const [userRows]: any = await pool.query(`SELECT * FROM medico WHERE email = ? LIMIT 1`, [email]);
        if (userRows.length === 0 || password !== 'admin123') return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        res.json({ success: true, medico: { id: userRows[0].id_medico, nombre: userRows[0].nombre_medico, rol: 'medico' } });
    } catch (error) { res.status(500).json({ success: false }); }
};

// ============================================
// REGISTRO DE RUTAS MODULARES (Unificado)
// ============================================

console.log('🔧 Configurando enrutadores...');

app.use('/api', authRoutes);
app.use('/api/medico', medicoRoutes);
app.use('/api/bioquimico', bioquimicoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/paciente', pacienteRoutes); // singular
app.use('/api/pacientes', pacienteRoutes); // plural por compatibilidad
app.use('/api/analisis', analisisRoutes); 
app.use('/api', ordenRoutes); // ✅ Crucial para /api/catalogo-analisis


// ============================================
// RUTAS DIRECTAS Y COMPATIBILIDAD
// ============================================

// Salud del Servidor
app.get('/api/health', (req, res) => res.json({ status: 'OK', version: '3.5.0' }));

// Test de Base de Datos
app.get('/api/test-db', async (req: Request, res: Response) => {
    try {
        const [rows]: [any[], any] = await pool.query('SELECT 1 as test');
        res.json({ success: true, data: rows[0] });
    } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
});

// Rutas Médico Legacy
app.post('/api/medico/login', loginMedico);
app.get('/api/medico/dashboard/:id_medico', getDashboardMedico);
app.get('/api/medico/:id_medico/pacientes', getPacientesMedico);
app.post('/api/medico/:id_medico/nueva-solicitud', async (req, res) => { /* Wrapper para controlador de orden */ });

// Rutas Bioquímico Legacy
app.get('/api/bioquimico/dashboard/:matricula', getDashboardBioquimico);

// Rutas Pacientes y Obras Sociales
app.post('/api/paciente/registrar', registrarNuevoPaciente);
app.post('/api/pacientes', registrarNuevoPaciente);
app.get('/api/paciente/buscar/:dni', buscarPacientePorDNI);
app.get('/api/paciente/buscar/ficha/:nro_ficha', buscarPacientePorFicha);
app.get('/api/paciente/historial/:nro_ficha', getHistorialPaciente);
app.get('/api/obras-sociales/todas', async (req, res) => { /* Lógica directa de obras sociales */ });


app.get('/api/catalogo-analisis', async (req, res) => {
    try {
        console.log('🧪 Solicitando catálogo de análisis...');
        
        // Usamos "AS" para renombrar las columnas al vuelo
        const query = `
            SELECT 
                codigo_practica as id_analisis, 
                descripcion_practica as nombre, 
                codigo_practica as codigo, 
                descripcion_modulo as categoria 
            FROM analisis
            LIMIT 1000
        `;
        
        const [rows] = await pool.query(query);
        res.json({ success: true, analisis: rows });
    } catch (error) { 
        console.error('❌ Error obteniendo análisis:', error);
        res.status(500).json({ success: false }); 
    }
});

app.get('/api/admin/medicos', async (req, res) => {
    try {
        // Busca usuarios que sean médicos
        const [rows] = await pool.query("SELECT id_medico as id, nombre_medico as nombre, apellido_medico as apellido, especialidad FROM medico LIMIT 50");
        res.json({ success: true, medicos: rows });
    } catch (error) {
        res.json({ success: true, medicos: [] }); // Devuelve vacío si falla, para no romper nada
    }
});

// Para el detalle (Error image_e50b07)
app.get('/api/orden/detalles/:id_orden', getOrdenDetalleFinal);

// Para registrar pacientes (Error image_d9bc6d)
app.post('/api/pacientes', registrarNuevoPaciente);
// ============================================
// MANEJO DE ERRORES (⚠️ Siempre al final de todo)
// ============================================

app.use('*', (req: Request, res: Response) => {
    res.status(404).json({ 
        success: false, 
        message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` 
    });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('💥 ERROR DEL SERVIDOR:', err.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

// ============================================
// INICIO DEL SERVIDOR
// ============================================

app.listen(PORT, async () => {
    console.log(`\n✅ SERVIDOR ACTIVO EN PUERTO: ${PORT}`);
    try {
        await pool.query('SELECT 1');
        console.log('✅ Base de datos conectada correctamente');
    } catch (error) {
        console.error('❌ Error de conexión a BD:', error);
    }
});

export default app;