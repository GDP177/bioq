// src/index.ts - SERVIDOR PRINCIPAL CON LOGIN UNIFICADO INTEGRADO

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';

// Importar rutas
import medicoRoutes from './routes/medico.routes';
import authRoutes from './routes/authRoutes';
import bioquimicoRoutes from './routes/bioquimico.routes';
import adminRoutes from './routes/admin.routes';
import analisisRoutes from './routes/analisis.routes';
import pacienteRoutes from './routes/paciente.routes';
import ordenRoutes from './routes/orden.routes';




import { 
    registrarNuevoPaciente,
    actualizarPaciente,
    buscarPacientePorDNI,
    buscarPacientePorFicha,
    buscarObrasSociales,
    buscarPacientesPorDNIParcial
} from './controllers/paciente.controller';

import { getDashboardBioquimico } from './controllers/bioquimico.controller';
import { getHistorialPaciente, getAnalisisDetalladoPorOrden } from './controllers/historial.controller';
import { pool } from './routes/db';

// Configurar dotenv
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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
// CONTROLADORES MANTENIDOS (SIN CAMBIOS)
// ============================================

// DASHBOARD MÉDICO - MANTENIDO SIN CAMBIOS
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

// OBTENER PACIENTES DEL MÉDICO - MANTENIDO SIN CAMBIOS
const getPacientesMedico = async (req: Request, res: Response) => {
  const id_medico = parseInt(req.params.id_medico);
  
  const buscar = getStringParam(req.query.buscar);
  const mutual = getStringParam(req.query.mutual);
  const sexo = getStringParam(req.query.sexo);
  const orden = getStringParam(req.query.orden) || 'reciente';
  const pagina = getNumberParam(req.query.pagina, 1);
  const limite = getNumberParam(req.query.limite, 20);

  try {
    console.log('👥 Obteniendo pacientes para médico ID:', id_medico);

    if (!id_medico || id_medico <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de médico inválido'
      });
    }

    let whereConditions = ['o.id_medico_solicitante = ?'];
    let queryParams: any[] = [id_medico];

    if (buscar && buscar.length > 0) {
      const searchTerm = `%${buscar}%`;
      whereConditions.push(`(
        p.Nombre_paciente LIKE ? OR 
        p.Apellido_paciente LIKE ? OR 
        p.DNI LIKE ?
      )`);
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (mutual && mutual !== 'todos') {
      whereConditions.push('p.mutual = ?');
      queryParams.push(mutual);
    }

    if (sexo && sexo !== 'todos') {
      whereConditions.push('p.sexo = ?');
      queryParams.push(sexo);
    }

    const whereClause = whereConditions.join(' AND ');

    let orderBy = 'MAX(o.fecha_ingreso_orden) DESC';
    switch (orden) {
      case 'nombre':
        orderBy = 'p.Apellido_paciente ASC, p.Nombre_paciente ASC';
        break;
      case 'edad_desc':
        orderBy = 'p.edad DESC';
        break;
      case 'edad_asc':
        orderBy = 'p.edad ASC';
        break;
      case 'mas_ordenes':
        orderBy = 'COUNT(o.id_orden) DESC';
        break;
    }

    const offset = (pagina - 1) * limite;

    // Query principal - CORREGIDO CON NOMBRES CORRECTOS
    const mainQuery = `
      SELECT 
        p.nro_ficha,
        p.Nombre_paciente,
        p.Apellido_paciente,
        p.DNI,
        p.fecha_nacimiento,
        p.edad,
        p.sexo,
        p.telefono,
        p.direccion,
        p.mutual,
        p.nro_afiliado,
        p.grupo_sanguineo,
        p.estado,
        p.fecha_alta,
        COUNT(o.id_orden) as total_ordenes,
        MAX(o.fecha_ingreso_orden) as ultima_orden
      FROM paciente p
      JOIN orden o ON p.nro_ficha = o.nro_ficha_paciente
      WHERE ${whereClause}
      GROUP BY p.nro_ficha, p.Nombre_paciente, p.Apellido_paciente, p.DNI, 
               p.fecha_nacimiento, p.edad, p.sexo, p.telefono, p.direccion,
               p.mutual, p.nro_afiliado, p.grupo_sanguineo, p.estado, p.fecha_alta
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limite, offset);

    const [pacientesRows]: [any[], any] = await pool.query(mainQuery, queryParams);

    // Query para contar total
    const countQuery = `
      SELECT COUNT(DISTINCT p.nro_ficha) as total
      FROM paciente p
      JOIN orden o ON p.nro_ficha = o.nro_ficha_paciente
      WHERE ${whereClause}
    `;

    const [countRows]: [any[], any] = await pool.query(countQuery, queryParams.slice(0, -2));
    const total = countRows[0]?.total || 0;

    // Formatear respuesta - CORREGIDO
    const pacientesFormateados = pacientesRows.map((paciente: any) => ({
      nro_ficha: paciente.nro_ficha,
      nombre: paciente.Nombre_paciente,
      apellido: paciente.Apellido_paciente,
      dni: parseInt(paciente.DNI),
      fecha_nacimiento: paciente.fecha_nacimiento,
      edad: paciente.edad,
      sexo: paciente.sexo,
      telefono: paciente.telefono,
      direccion: paciente.direccion,
      mutual: paciente.mutual,
      nro_afiliado: paciente.nro_afiliado,
      grupo_sanguineo: paciente.grupo_sanguineo,
      estado: paciente.estado,
      fecha_alta: paciente.fecha_alta,
      total_ordenes: parseInt(paciente.total_ordenes),
      ultima_orden: paciente.ultima_orden
    }));

    console.log('✅ Pacientes procesados:', pacientesFormateados.length);

    return res.status(200).json({
      success: true,
      pacientes: pacientesFormateados,
      total,
      pagina_actual: pagina,
      total_paginas: Math.ceil(total / limite),
      filtros_aplicados: { buscar, mutual, sexo, orden }
    });

  } catch (error: any) {
    console.error('💥 ERROR al obtener pacientes:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al obtener pacientes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// OBTENER TODAS LAS OBRAS SOCIALES - MANTENIDO SIN CAMBIOS
const getTodasObrasSociales = async (req: Request, res: Response) => {
  try {
    console.log('🏥 Obteniendo todas las obras sociales...');

    const query = `
      SELECT DISTINCT mutual as obra_social, COUNT(*) as cantidad_pacientes
      FROM paciente 
      WHERE mutual IS NOT NULL 
        AND mutual != '' 
        AND mutual != 'NULL'
      GROUP BY mutual
      ORDER BY cantidad_pacientes DESC, mutual ASC
    `;

    const [obrasSocialesRows]: [any[], any] = await pool.query(query);

    const obrasSociales = obrasSocialesRows.map((row: any) => row.obra_social);

    // Agregar obras sociales comunes
    const obrasSocialesComunes = [
      'OSDE', 'Swiss Medical', 'Galeno', 'Medicus', 'PAMI', 'IOMA',
      'Obra Social Provincial', 'Particular', 'Sin obra social', 'Otra'
    ];

    const todasLasObrasSociales = [...new Set([...obrasSociales, ...obrasSocialesComunes])];

    console.log('✅ Obras sociales obtenidas:', todasLasObrasSociales.length);

    return res.status(200).json({
      success: true,
      obras_sociales: todasLasObrasSociales,
      total: todasLasObrasSociales.length
    });

  } catch (error: any) {
    console.error('💥 ERROR al obtener obras sociales:', error);
    
    const obrasSocialesFallback = [
      'OSDE', 'Swiss Medical', 'Galeno', 'Medicus', 'PAMI', 'IOMA',
      'Obra Social Provincial', 'Particular', 'Sin obra social', 'Otra'
    ];
    
    return res.status(200).json({
      success: true,
      obras_sociales: obrasSocialesFallback,
      total: obrasSocialesFallback.length
    });
  }
};

// OBTENER ANÁLISIS DISPONIBLES - MANTENIDO SIN CAMBIOS
const getAnalisisDisponibles = async (req: Request, res: Response) => {
  try {
    console.log('🧪 Obteniendo análisis disponibles');

    // Análisis por defecto hasta que tengas tabla completa
    const analisis = [
      { codigo: 1001, descripcion: 'Hemograma Completo', tipo: 'Hematología', honorarios: 1500, requiere_ayuno: false },
      { codigo: 1002, descripcion: 'Glucemia', tipo: 'Bioquímica', honorarios: 800, requiere_ayuno: true },
      { codigo: 1003, descripcion: 'Colesterol Total', tipo: 'Bioquímica', honorarios: 900, requiere_ayuno: true },
      { codigo: 1004, descripcion: 'Triglicéridos', tipo: 'Bioquímica', honorarios: 900, requiere_ayuno: true },
      { codigo: 1005, descripcion: 'Urea', tipo: 'Bioquímica', honorarios: 700, requiere_ayuno: false },
      { codigo: 1006, descripcion: 'Creatinina', tipo: 'Bioquímica', honorarios: 700, requiere_ayuno: false },
      { codigo: 1007, descripcion: 'Orina Completa', tipo: 'Urología', honorarios: 1200, requiere_ayuno: false },
      { codigo: 1008, descripcion: 'TSH', tipo: 'Endocrinología', honorarios: 2000, requiere_ayuno: false },
      { codigo: 1009, descripcion: 'T4 Libre', tipo: 'Endocrinología', honorarios: 2200, requiere_ayuno: false },
      { codigo: 1010, descripcion: 'Hepatograma', tipo: 'Bioquímica', honorarios: 1800, requiere_ayuno: true }
    ];

    console.log('✅ Análisis disponibles obtenidos:', analisis.length);

    return res.status(200).json({
      success: true,
      analisis,
      total: analisis.length
    });

  } catch (error: any) {
    console.error('💥 ERROR al obtener análisis disponibles:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al obtener análisis disponibles'
    });
  }
};

// BUSCAR PACIENTES - MANTENIDO SIN CAMBIOS
const buscarPacientes = async (req: Request, res: Response) => {
  const { query } = req.params;
  
  try {
    console.log('👥 Buscando pacientes:', query);

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Query debe tener al menos 2 caracteres'
      });
    }

    const searchTerm = `%${query.trim()}%`;
    
    const searchQuery = `
      SELECT 
        nro_ficha,
        Nombre_paciente as nombre,
        Apellido_paciente as apellido,
        DNI as dni,
        edad,
        sexo,
        mutual,
        nro_afiliado,
        telefono,
        fecha_nacimiento
      FROM paciente 
      WHERE 
        (Nombre_paciente LIKE ? OR 
         Apellido_paciente LIKE ? OR 
         DNI LIKE ?)
        AND (estado IS NULL OR estado = 'activo')
      ORDER BY Apellido_paciente ASC, Nombre_paciente ASC
      LIMIT 10
    `;

    const [pacientesRows]: [any[], any] = await pool.query(searchQuery, [searchTerm, searchTerm, searchTerm]);

    const pacientes = pacientesRows.map((p: any) => ({
      nro_ficha: p.nro_ficha,
      nombre: p.nombre,
      apellido: p.apellido,
      dni: parseInt(p.dni),
      edad: p.edad,
      sexo: p.sexo,
      mutual: p.mutual,
      nro_afiliado: p.nro_afiliado,
      telefono: p.telefono,
      fecha_nacimiento: p.fecha_nacimiento
    }));

    console.log('✅ Pacientes encontrados:', pacientes.length);

    return res.status(200).json({
      success: true,
      pacientes,
      total: pacientes.length
    });

  } catch (error: any) {
    console.error('💥 ERROR al buscar pacientes:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al buscar pacientes'
    });
  }
};

// CREAR NUEVA SOLICITUD - MANTENIDO SIN CAMBIOS
const crearNuevaSolicitud = async (req: Request, res: Response) => {
  const id_medico = parseInt(req.params.id_medico);
  const {
    nro_ficha_paciente,
    analisis_solicitados,
    urgente,
    requiere_ayuno,
    observaciones,
    instrucciones_paciente
  } = req.body;

  try {
    console.log('📋 Creando nueva solicitud para médico:', id_medico);

    // Validaciones
    if (!id_medico || !nro_ficha_paciente || !analisis_solicitados || analisis_solicitados.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos: médico, paciente y análisis son requeridos'
      });
    }

    // Verificar que el paciente existe
    const [pacienteCheck]: [any[], any] = await pool.query(
      'SELECT nro_ficha FROM paciente WHERE nro_ficha = ?',
      [nro_ficha_paciente]
    );

    if (pacienteCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Iniciar transacción
    await pool.query('START TRANSACTION');

    try {
      // Crear la orden
      const fechaActual = new Date();
      const nroOrden = `ORD-${Date.now()}`;

      const [ordenResult]: [any, any] = await pool.query(
        `INSERT INTO orden (
          nro_orden,
          nro_ficha_paciente,
          id_medico_solicitante,
          fecha_ingreso_orden,
          estado,
          urgente,
          observaciones
        ) VALUES (?, ?, ?, ?, 'pendiente', ?, ?)`,
        [
          nroOrden,
          nro_ficha_paciente,
          id_medico,
          fechaActual,
          urgente ? 1 : 0,
          observaciones || null
        ]
      );

      const id_orden = ordenResult.insertId;

      // Crear los análisis de la orden
      for (const codigoAnalisis of analisis_solicitados) {
        await pool.query(
          `INSERT INTO orden_analisis (
            id_orden,
            codigo_practica,
            estado,
            requiere_ayuno,
            instrucciones_paciente
          ) VALUES (?, ?, 'pendiente', ?, ?)`,
          [
            id_orden,
            codigoAnalisis,
            requiere_ayuno ? 1 : 0,
            instrucciones_paciente || null
          ]
        );
      }

      // Confirmar transacción
      await pool.query('COMMIT');

      console.log('✅ Solicitud creada exitosamente. ID orden:', id_orden);

      return res.status(201).json({
        success: true,
        message: 'Solicitud creada exitosamente',
        orden_id: id_orden,
        nro_orden: nroOrden,
        total_analisis: analisis_solicitados.length
      });

    } catch (transactionError) {
      await pool.query('ROLLBACK');
      throw transactionError;
    }

  } catch (error: any) {
    console.error('💥 ERROR al crear solicitud:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al crear la solicitud'
    });
  }
};

// CONTROLADOR DE LOGIN MÉDICO LEGACY - MANTENIDO PARA COMPATIBILIDAD
const loginMedico = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    console.log('🔐 Login médico legacy:', { email, password: '***' });

    // Validación básica
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Query para buscar usuario - ADAPTADO A TU BD
    const [userRows]: [any[], any] = await pool.query(
      `SELECT 
        m.id_medico,
        m.nombre_medico,
        m.apellido_medico,
        m.email,
        m.especialidad,
        m.matricula_medica,
        m.activo
       FROM medico m
       WHERE m.email = ? AND (m.activo IS NULL OR m.activo = 1)
       LIMIT 1`,
      [email]
    );

    console.log('👤 Usuarios encontrados:', userRows.length);

    if (userRows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email no registrado o usuario inactivo'
      });
    }

    const medico = userRows[0];

    // Por ahora, login simple sin hash de contraseña
    // En producción deberías usar bcrypt
    if (password !== 'admin123') { // Cambia por tu lógica de contraseña
      return res.status(401).json({
        success: false,
        message: 'Contraseña incorrecta'
      });
    }

    // Login exitoso
    const medicoData = {
      id: medico.id_medico,
      nombre: medico.nombre_medico,
      apellido: medico.apellido_medico,
      email: medico.email,
      especialidad: medico.especialidad,
      matricula: medico.matricula_medica,
      rol: 'medico'
    };

    console.log('✅ Login médico legacy exitoso:', medicoData.nombre, medicoData.apellido);

    return res.status(200).json({
      success: true,
      message: 'Login exitoso',
      medico: medicoData
    });

  } catch (error: any) {
    console.error('💥 ERROR en login médico legacy:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
//rutas de analisis y pacienetes


app.use('/api/paciente', pacienteRoutes); // Agrega el prefijo /api/paciente
app.use('/api', ordenRoutes);            // Agrega el prefijo /api (para /admin/analisis y /medico/...)
// ============================================
// MIDDLEWARES
// ============================================

app.use(cors({
    origin: [
        'http://localhost:3000', 
        'http://127.0.0.1:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`🌐 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});





// ============================================
// RUTAS PRINCIPALES (⚠️ EL ORDEN ES IMPORTANTE)
// ============================================

console.log('🔧 Configurando rutas...');

app.use('/api', authRoutes);
app.use('/api/medico', medicoRoutes);
app.use('/api/bioquimico', bioquimicoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api', ordenRoutes);
app.use('/api/analisis', analisisRoutes);


app.use('/api', authRoutes);
app.use('/api/medico', medicoRoutes);
app.use('/api/bioquimico', bioquimicoRoutes);
app.use('/api/admin', adminRoutes);

// Rutas Directas Mantenidas
app.get('/api/medico/dashboard/:id_medico', getDashboardMedico);
app.get('/api/health', (req, res) => res.json({ status: 'OK', version: '3.5.0' }));

// ✅ RUTA DE ANÁLISIS MOVIDA ANTES DEL MIDDLEWARE DE ERROR 404
app.use('/api/analisis', analisisRoutes); 

// RUTAS PARA NUEVA SOLICITUD
app.use('/api/paciente', pacienteRoutes); // Para /api/paciente/buscar/:dni
app.use('/api', ordenRoutes);            // Para /api/admin/analisis

// Rutas Legacy y Directas
app.post('/api/medico/login', loginMedico);
app.get('/api/medico/dashboard/:id_medico', getDashboardMedico);
app.get('/api/bioquimico/dashboard/:matricula_profesional', getDashboardBioquimico);
app.get('/api/analisis/disponibles', getAnalisisDisponibles);
app.get('/api/pacientes/buscar/:query', buscarPacientes);
app.post('/api/medico/:id_medico/nueva-solicitud', crearNuevaSolicitud);
app.get('/api/medico/:id_medico/pacientes', getPacientesMedico);
app.post('/api/pacientes', registrarNuevoPaciente);
app.post('/api/paciente/registrar', registrarNuevoPaciente);
app.put('/api/paciente/actualizar/:nro_ficha', actualizarPaciente);
app.get('/api/paciente/buscar/:dni', buscarPacientePorDNI);
app.get('/api/paciente/buscar/ficha/:nro_ficha', buscarPacientePorFicha);
app.get('/api/pacientes/buscar-por-dni/:dni_parcial', buscarPacientesPorDNIParcial);
app.get('/api/paciente/historial/:nro_ficha', getHistorialPaciente);
app.get('/api/orden/analisis/:id_orden', getAnalisisDetalladoPorOrden);
app.get('/api/obras-sociales/buscar/:texto', buscarObrasSociales);
app.get('/api/obras-sociales/todas', getTodasObrasSociales);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Servidor funcionando - VERSIÓN CON LOGIN UNIFICADO',
    version: '3.1.0'
  });
});

app.get('/api/test-db', async (req: Request, res: Response) => {
  try {
    const [rows]: [any[], any] = await pool.query('SELECT 1 as test, NOW() as timestamp');
    res.json({ success: true, message: 'Conexión a BD exitosa', data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error de conexión a BD', error: error.message });
  }
});

// ============================================
// MIDDLEWARES DE ERROR (⚠️ SIEMPRE AL FINAL)
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
// INICIAR SERVIDOR
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