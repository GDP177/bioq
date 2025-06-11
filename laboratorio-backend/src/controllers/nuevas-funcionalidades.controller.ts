// src/controllers/nuevas-funcionalidades.controller.ts

import { Request, Response } from 'express';
import { pool } from '../routes/db';

// Registrar nuevo paciente
// Actualización del controlador registrarNuevoPaciente para manejar obras sociales personalizadas
export const registrarNuevoPaciente = async (req: Request, res: Response) => {
  const {
    dni,
    nombre,
    apellido,
    fecha_nacimiento,
    edad,
    sexo,
    telefono,
    direccion,
    email,
    mutual,
    nro_afiliado,
    grupo_sanguineo,
    contacto_emergencia,
    telefono_emergencia,
    observaciones
  } = req.body;

  try {
    console.log('👥 Registrando nuevo paciente con DNI:', dni);

    // Validaciones básicas
    if (!dni || !nombre || !apellido || !fecha_nacimiento || !sexo) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos obligatorios (DNI, nombre, apellido, fecha de nacimiento, sexo)'
      });
    }

    // Verificar que el DNI no exista
    const [pacienteExistente]: any = await pool.query(
      'SELECT nro_ficha FROM paciente WHERE dni = ?',
      [dni]
    );

    if (pacienteExistente.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un paciente registrado con este DNI'
      });
    }

    // Generar número de ficha único
    const [ultimaFicha]: any = await pool.query(
      'SELECT MAX(nro_ficha) as ultima_ficha FROM paciente'
    );
    const nroFicha = (ultimaFicha[0]?.ultima_ficha || 0) + 1;

    // Procesar obra social - limpiar y capitalizar si es personalizada
    let obraSocialFinal = mutual;
    if (mutual && mutual.trim()) {
      const obrasSocialesComunes = [
        "OSDE", "Swiss Medical", "Galeno", "Medicus", "IOMA", 
        "PAMI", "OSECAC", "OSPLAD", "Accord Salud", "Sancor Salud", "Particular"
      ];
      
      // Si no está en la lista de comunes, capitalizar correctamente
      if (!obrasSocialesComunes.includes(mutual)) {
        obraSocialFinal = mutual.trim()
            .split(' ')
            .map((word: string) => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(' ');

      }
    }

    // Insertar nuevo paciente
    const [resultado]: any = await pool.query(
      `INSERT INTO paciente (
        nro_ficha,
        dni,
        nombre_paciente,
        apellido_paciente,
        fecha_nacimiento,
        edad,
        sexo,
        telefono,
        direccion,
        email,
        mutual,
        nro_afiliado,
        grupo_sanguineo,
        contacto_emergencia,
        telefono_emergencia,
        observaciones,
        fecha_registro,
        estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'activo')`,
      [
        nroFicha,
        dni,
        nombre,
        apellido,
        fecha_nacimiento,
        edad,
        sexo,
        telefono || null,
        direccion || null,
        email || null,
        obraSocialFinal || null,
        nro_afiliado || null,
        grupo_sanguineo || null,
        contacto_emergencia || null,
        telefono_emergencia || null,
        observaciones || null
      ]
    );

    console.log('✅ Paciente registrado exitosamente:', nombre, apellido);

    // Log de obra social personalizada si es nueva
    if (obraSocialFinal && !["OSDE", "Swiss Medical", "Galeno", "Medicus", "IOMA", "PAMI", "OSECAC", "OSPLAD", "Accord Salud", "Sancor Salud", "Particular"].includes(obraSocialFinal)) {
      console.log('🏥 Obra social personalizada registrada:', obraSocialFinal);
    }

    return res.status(201).json({
      success: true,
      message: 'Paciente registrado exitosamente',
      paciente: {
        nro_ficha: nroFicha,
        dni: dni,
        nombre: nombre,
        apellido: apellido,
        edad: edad,
        sexo: sexo,
        mutual: obraSocialFinal
      }
    });

  } catch (error) {
    console.error('💥 ERROR al registrar paciente:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al registrar el paciente'
    });
  }
};


// Buscar obras sociales personalizadas (para autocompletado)
export const buscarObrasSociales = async (req: Request, res: Response) => {
  const textoBusqueda = req.params.texto;

  try {
    console.log('🏥 Buscando obras sociales con texto:', textoBusqueda);

    if (!textoBusqueda || textoBusqueda.length < 2) {
      return res.status(400).json({ 
        success: false,
        message: 'Texto de búsqueda debe tener al menos 2 caracteres' 
      });
    }

    // Lista de obras sociales predefinidas para filtrar
    const obrasSocialesComunes = [
      "OSDE", "Swiss Medical", "Galeno", "Medicus", "IOMA", 
      "PAMI", "OSECAC", "OSPLAD", "Accord Salud", "Sancor Salud", "Particular"
    ];

    // Buscar obras sociales personalizadas en la base de datos
    const [obrasSocialesRows]: any = await pool.query(
      `SELECT DISTINCT mutual as obra_social
       FROM paciente 
       WHERE mutual IS NOT NULL 
       AND mutual != '' 
       AND mutual LIKE ?
       AND mutual NOT IN (${obrasSocialesComunes.map(() => '?').join(',')})
       ORDER BY mutual ASC
       LIMIT 10`,
      [`%${textoBusqueda}%`, ...obrasSocialesComunes]
    );

    const obrasSociales = obrasSocialesRows.map((row: any) => row.obra_social);

    console.log('✅ Obras sociales encontradas:', obrasSociales.length);

    return res.status(200).json({
      success: true,
      obras_sociales: obrasSociales,
      total: obrasSociales.length
    });

  } catch (error) {
    console.error('💥 ERROR al buscar obras sociales:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al buscar obras sociales'
    });
  }
};

// ============================================
// CONTROLADORES PARA NUEVA SOLICITUD
// ============================================
// Buscar pacientes por DNI parcial (para autocompletado)
export const buscarPacientesPorDNIParcial = async (req: Request, res: Response) => {
  const dniParcial = req.params.dni_parcial;

  try {
    console.log('🔍 Buscando pacientes con DNI parcial:', dniParcial);

    if (!dniParcial || dniParcial.length < 2) {
      return res.status(400).json({ 
        success: false,
        message: 'DNI debe tener al menos 2 dígitos' 
      });
    }

    // Validar que solo contenga números
    if (!/^\d+$/.test(dniParcial)) {
      return res.status(400).json({ 
        success: false,
        message: 'DNI debe contener solo números' 
      });
    }

    const [pacientesRows]: any = await pool.query(
      `SELECT 
        nro_ficha,
        nombre_paciente,
        apellido_paciente,
        dni,
        fecha_nacimiento,
        edad,
        sexo,
        telefono,
        direccion,
        email,
        mutual,
        nro_afiliado,
        grupo_sanguineo
       FROM paciente 
       WHERE dni LIKE ? 
       AND estado = 'activo'
       ORDER BY dni ASC
       LIMIT 10`, // Limitar a 10 resultados para mejor performance
      [`${dniParcial}%`]
    );

    console.log('✅ Pacientes encontrados:', pacientesRows.length);

    const pacientes = pacientesRows.map((paciente: any) => ({
      nro_ficha: paciente.nro_ficha,
      nombre: paciente.nombre_paciente,
      apellido: paciente.apellido_paciente,
      dni: paciente.dni,
      edad: paciente.edad,
      sexo: paciente.sexo,
      mutual: paciente.mutual,
      nro_afiliado: paciente.nro_afiliado,
      telefono: paciente.telefono,
      email: paciente.email
    }));

    return res.status(200).json({
      success: true,
      pacientes: pacientes,
      total: pacientesRows.length
    });

  } catch (error) {
    console.error('💥 ERROR al buscar pacientes por DNI parcial:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al buscar pacientes'
    });
  }
};

// ---


// Obtener análisis disponibles
export const getAnalisisDisponibles = async (req: Request, res: Response) => {
  try {
    console.log('📋 Obteniendo análisis disponibles...');

    const [analisisRows]: any = await pool.query(
      `SELECT 
        codigo_practica,
        descripcion_practica,
        TIPO as tipo,
        codigo_modulo,
        descripcion_modulo,
        HONORARIOS as honorarios,
        GASTOS as gastos
       FROM analisis 
       WHERE descripcion_practica IS NOT NULL
       ORDER BY descripcion_practica ASC`
    );

    console.log('✅ Análisis obtenidos:', analisisRows.length);

    return res.status(200).json({
      success: true,
      analisis: analisisRows.map((analisis: any) => ({
        codigo: analisis.codigo_practica,
        descripcion: analisis.descripcion_practica,
        tipo: analisis.tipo,
        codigo_modulo: analisis.codigo_modulo,
        descripcion_modulo: analisis.descripcion_modulo,
        honorarios: analisis.honorarios,
        gastos: analisis.gastos,
        requiere_ayuno: false // TODO: Agregar esta info a la BD si es necesario
      }))
    });

  } catch (error) {
    console.error('💥 ERROR al obtener análisis:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al obtener análisis disponibles'
    });
  }
};

// Buscar paciente por DNI
export const buscarPacientePorDNI = async (req: Request, res: Response) => {
  const dni = req.params.dni;

  try {
    console.log('🔍 Buscando paciente con DNI:', dni);

    const [pacienteRows]: any = await pool.query(
      `SELECT 
        nro_ficha,
        nombre_paciente,
        apellido_paciente,
        dni,
        fecha_nacimiento,
        edad,
        sexo,
        telefono,
        direccion,
        email,
        mutual,
        nro_afiliado,
        grupo_sanguineo
       FROM paciente 
       WHERE dni = ? AND estado = 'activo'`,
      [dni]
    );

    if (pacienteRows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Paciente no encontrado' 
      });
    }

    const paciente = pacienteRows[0];

    console.log('✅ Paciente encontrado:', paciente.nombre_paciente);

    return res.status(200).json({
      success: true,
      paciente: {
        nro_ficha: paciente.nro_ficha,
        nombre: paciente.nombre_paciente,
        apellido: paciente.apellido_paciente,
        dni: paciente.dni,
        edad: paciente.edad,
        sexo: paciente.sexo,
        mutual: paciente.mutual,
        nro_afiliado: paciente.nro_afiliado,
        telefono: paciente.telefono,
        email: paciente.email
      }
    });

  } catch (error) {
    console.error('💥 ERROR al buscar paciente:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al buscar paciente'
    });
  }
};

// Crear nueva solicitud
export const crearNuevaSolicitud = async (req: Request, res: Response) => {
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
    console.log('➕ Creando nueva solicitud para médico:', id_medico);

    if (!id_medico || !nro_ficha_paciente || !analisis_solicitados?.length) {
      return res.status(400).json({ 
        success: false,
        message: 'Datos incompletos para crear la solicitud' 
      });
    }

    // Iniciar transacción
    await pool.query('START TRANSACTION');

    try {
      // Generar número de orden
      const nro_orden = `ORD-${Date.now()}`;

      // Calcular costo total
      const [costosRows]: any = await pool.query(
        `SELECT SUM(HONORARIOS + GASTOS) as costo_total 
         FROM analisis 
         WHERE codigo_practica IN (${analisis_solicitados.map(() => '?').join(',')})`,
        analisis_solicitados
      );

      const costo_total = costosRows[0]?.costo_total || 0;

      // Crear la orden
      const [ordenResult]: any = await pool.query(
        `INSERT INTO orden (
          nro_orden, nro_ficha_paciente, id_medico_solicitante,
          fecha_ingreso_orden, urgente, estado, observaciones,
          instrucciones_paciente, requiere_ayuno, costo_total
        ) VALUES (?, ?, ?, NOW(), ?, 'pendiente', ?, ?, ?, ?)`,
        [
          nro_orden, nro_ficha_paciente, id_medico,
          urgente ? 1 : 0, observaciones, instrucciones_paciente,
          requiere_ayuno ? 1 : 0, costo_total
        ]
      );

      const orden_id = ordenResult.insertId;

      // Crear los análisis asociados
      for (const codigo_practica of analisis_solicitados) {
        await pool.query(
          `INSERT INTO orden_analisis (
            id_orden, codigo_practica, estado, fecha_creacion
          ) VALUES (?, ?, 'pendiente', NOW())`,
          [orden_id, codigo_practica]
        );
      }

      // Confirmar transacción
      await pool.query('COMMIT');

      console.log('✅ Solicitud creada exitosamente:', nro_orden);

      return res.status(201).json({
        success: true,
        message: 'Solicitud creada exitosamente',
        orden_id: orden_id,
        nro_orden: nro_orden
      });

    } catch (error) {
      // Revertir transacción en caso de error
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('💥 ERROR al crear solicitud:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al crear la solicitud'
    });
  }
};

// ============================================
// CONTROLADORES PARA GESTIÓN DE PACIENTES
// ============================================

// Obtener pacientes del médico
export const getPacientesMedico = async (req: Request, res: Response) => {
  const id_medico = parseInt(req.params.id_medico);
  const { 
    buscar, mutual, sexo, orden = 'reciente', 
    pagina = 1, limite = 20 
  } = req.query;

  try {
    console.log('👥 Obteniendo pacientes para médico ID:', id_medico);

    // Construir WHERE clause
    let whereConditions = ['o.id_medico_solicitante = ?'];
    let queryParams: any[] = [id_medico];

    if (buscar) {
      whereConditions.push(`(
        p.nombre_paciente LIKE ? OR 
        p.apellido_paciente LIKE ? OR 
        p.dni LIKE ?
      )`);
      const searchTerm = `%${buscar}%`;
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

    // Determinar ORDER BY
    let orderBy = 'MAX(o.fecha_ingreso_orden) DESC';
    switch (orden) {
      case 'nombre':
        orderBy = 'p.apellido_paciente ASC, p.nombre_paciente ASC';
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

    // Query principal con paginación
    const offset = (parseInt(pagina as string) - 1) * parseInt(limite as string);
    
    const mainQuery = `
      SELECT 
        p.nro_ficha,
        p.nombre_paciente,
        p.apellido_paciente,
        p.dni,
        p.fecha_nacimiento,
        p.edad,
        p.sexo,
        p.telefono,
        p.direccion,
        p.email,
        p.mutual,
        p.nro_afiliado,
        p.grupo_sanguineo,
        p.estado,
        p.fecha_creacion,
        COUNT(o.id_orden) as total_ordenes,
        MAX(o.fecha_ingreso_orden) as ultima_orden
      FROM paciente p
      JOIN orden o ON p.nro_ficha = o.nro_ficha_paciente
      WHERE ${whereClause}
      GROUP BY p.nro_ficha, p.nombre_paciente, p.apellido_paciente, p.dni, 
               p.fecha_nacimiento, p.edad, p.sexo, p.telefono, p.direccion,
               p.email, p.mutual, p.nro_afiliado, p.grupo_sanguineo, p.estado, p.fecha_creacion
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limite as string), offset);

    const [pacientesRows]: any = await pool.query(mainQuery, queryParams);

    // Query para contar total
    const countQuery = `
      SELECT COUNT(DISTINCT p.nro_ficha) as total
      FROM paciente p
      JOIN orden o ON p.nro_ficha = o.nro_ficha_paciente
      WHERE ${whereClause}
    `;

    const [countRows]: any = await pool.query(countQuery, queryParams.slice(0, -2));
    const total = countRows[0]?.total || 0;

    console.log('📊 Pacientes encontrados:', pacientesRows.length);

    return res.status(200).json({
      success: true,
      pacientes: pacientesRows,
      total,
      pagina_actual: parseInt(pagina as string),
      total_paginas: Math.ceil(total / parseInt(limite as string))
    });

  } catch (error) {
    console.error('💥 ERROR al obtener pacientes:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al obtener pacientes'
    });
  }
};

// ============================================
// CONTROLADORES PARA GESTIÓN DE ANÁLISIS
// ============================================

// Obtener análisis del médico
export const getAnalisisMedico = async (req: Request, res: Response) => {
  const id_medico = parseInt(req.params.id_medico);
  const { 
    estado, tipo, buscar, fecha_desde, fecha_hasta 
  } = req.query;

  try {
    console.log('🧪 Obteniendo análisis para médico ID:', id_medico);

    // Construir WHERE clause
    let whereConditions = ['o.id_medico_solicitante = ?'];
    let queryParams: any[] = [id_medico];

    if (estado && estado !== 'todos') {
      whereConditions.push('oa.estado = ?');
      queryParams.push(estado);
    }

    if (tipo && tipo !== 'todos') {
      whereConditions.push('a.TIPO = ?');
      queryParams.push(tipo);
    }

    if (buscar) {
      whereConditions.push(`(
        a.descripcion_practica LIKE ? OR 
        p.nombre_paciente LIKE ? OR 
        p.apellido_paciente LIKE ? OR 
        o.nro_orden LIKE ?
      )`);
      const searchTerm = `%${buscar}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (fecha_desde) {
      whereConditions.push('DATE(o.fecha_ingreso_orden) >= ?');
      queryParams.push(fecha_desde);
    }

    if (fecha_hasta) {
      whereConditions.push('DATE(o.fecha_ingreso_orden) <= ?');
      queryParams.push(fecha_hasta);
    }

    const whereClause = whereConditions.join(' AND ');

    // Query principal
    const mainQuery = `
      SELECT 
        oa.id_orden_analisis as id,
        oa.codigo_practica,
        oa.estado,
        oa.fecha_realizacion,
        oa.valor_hallado,
        oa.unidad_hallada,
        oa.valor_referencia_aplicado,
        oa.interpretacion,
        oa.observaciones,
        oa.tecnico_responsable,
        a.descripcion_practica,
        a.TIPO as tipo,
        o.id_orden,
        o.nro_orden,
        o.fecha_ingreso_orden,
        o.urgente,
        p.nombre_paciente,
        p.apellido_paciente,
        p.dni,
        p.edad
      FROM orden_analisis oa
      JOIN orden o ON oa.id_orden = o.id_orden
      JOIN analisis a ON oa.codigo_practica = a.codigo_practica
      JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
      WHERE ${whereClause}
      ORDER BY o.fecha_ingreso_orden DESC, a.descripcion_practica ASC
      LIMIT 200
    `;

    const [analisisRows]: any = await pool.query(mainQuery, queryParams);

    // Estadísticas
    const estadisticasQuery = `
      SELECT 
        COUNT(*) as total_analisis,
        SUM(CASE WHEN oa.estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN oa.estado = 'procesando' THEN 1 ELSE 0 END) as procesando,
        SUM(CASE WHEN oa.estado = 'finalizado' THEN 1 ELSE 0 END) as finalizados,
        SUM(CASE WHEN oa.valor_hallado IS NOT NULL THEN 1 ELSE 0 END) as con_resultados
      FROM orden_analisis oa
      JOIN orden o ON oa.id_orden = o.id_orden
      JOIN analisis a ON oa.codigo_practica = a.codigo_practica
      WHERE ${whereClause}
    `;

    const [estadisticasRows]: any = await pool.query(estadisticasQuery, queryParams);
    const estadisticas = estadisticasRows[0];

    console.log('📊 Análisis encontrados:', analisisRows.length);

    // Formatear respuesta
    const analisisFormateados = analisisRows.map((item: any) => ({
      id: item.id,
      codigo_practica: item.codigo_practica,
      descripcion: item.descripcion_practica,
      tipo: item.tipo,
      estado: item.estado,
      fecha_realizacion: item.fecha_realizacion,
      valor_hallado: item.valor_hallado,
      unidad_hallada: item.unidad_hallada,
      valor_referencia: item.valor_referencia_aplicado,
      interpretacion: item.interpretacion,
      observaciones: item.observaciones,
      tecnico_responsable: item.tecnico_responsable,
      orden: {
        id: item.id_orden,
        nro_orden: item.nro_orden,
        fecha_ingreso: item.fecha_ingreso_orden,
        urgente: item.urgente === 1,
        paciente: {
          nombre: item.nombre_paciente,
          apellido: item.apellido_paciente,
          dni: item.dni,
          edad: item.edad
        }
      }
    }));

    return res.status(200).json({
      success: true,
      analisis: analisisFormateados,
      total: analisisRows.length,
      estadisticas: {
        total_analisis: estadisticas.total_analisis || 0,
        pendientes: estadisticas.pendientes || 0,
        procesando: estadisticas.procesando || 0,
        finalizados: estadisticas.finalizados || 0,
        con_resultados: estadisticas.con_resultados || 0
      },
      filtros_aplicados: {
        estado, tipo, buscar, fecha_desde, fecha_hasta
      }
    });

  } catch (error) {
    console.error('💥 ERROR al obtener análisis:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al obtener análisis'
    });
  }

  
};