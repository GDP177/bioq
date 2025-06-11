// src/controllers/pacientes.controller.ts - CORREGIDO PARA LA BD ACTUAL

import { Request, Response } from 'express';
import { pool } from '../routes/db';

// Función auxiliar para calcular edad
const calcularEdad = (fechaNacimiento: string): number => {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  
  return Math.max(0, edad);
};

// Función auxiliar para validar email
const validarEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Función auxiliar para limpiar teléfono (convertir a int)
const limpiarTelefono = (telefono: string): number | null => {
  const numeroLimpio = telefono.replace(/\D/g, '');
  return numeroLimpio.length >= 8 ? parseInt(numeroLimpio) : null;
};

// Registrar nuevo paciente - CORREGIDO PARA LA ESTRUCTURA ACTUAL
export const registrarNuevoPaciente = async (req: Request, res: Response) => {
  const {
    dni,
    nombre,
    apellido,
    fecha_nacimiento,
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

    // ============================================
    // VALIDACIONES BÁSICAS
    // ============================================

    if (!dni || !nombre || !apellido || !fecha_nacimiento || !sexo) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos obligatorios: DNI, nombre, apellido, fecha de nacimiento y sexo son requeridos'
      });
    }

    // Validar DNI
    if (typeof dni !== 'number' || dni <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El DNI debe ser un número válido mayor a 0'
      });
    }

    if (dni.toString().length < 7 || dni.toString().length > 8) {
      return res.status(400).json({
        success: false,
        message: 'El DNI debe tener entre 7 y 8 dígitos'
      });
    }

    // Validar nombre y apellido
    if (nombre.trim().length < 2 || apellido.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'El nombre y apellido deben tener al menos 2 caracteres'
      });
    }

    // Validar fecha de nacimiento y calcular edad
    const fechaNac = new Date(fecha_nacimiento);
    if (isNaN(fechaNac.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Fecha de nacimiento inválida'
      });
    }

    const edad = calcularEdad(fecha_nacimiento);
    if (edad < 0 || edad > 120) {
      return res.status(400).json({
        success: false,
        message: 'Fecha de nacimiento inválida - edad fuera del rango permitido'
      });
    }

    // Validar sexo
    if (!['M', 'F', 'X'].includes(sexo.upper || sexo)) {
      return res.status(400).json({
        success: false,
        message: 'Sexo debe ser M (Masculino), F (Femenino) o X (Otro)'
      });
    }

    // Validar email si se proporciona
    if (email && email.trim() && !validarEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'El formato del email no es válido'
      });
    }

    // ============================================
    // VERIFICAR DUPLICADOS
    // ============================================

    // Verificar que el DNI no exista (usar la columna correcta: DNI no dni)
    const [pacienteExistente]: any = await pool.query(
      'SELECT nro_ficha FROM paciente WHERE DNI = ?',
      [dni]
    );

    if (pacienteExistente.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Ya existe un paciente registrado con DNI ${dni}`,
        nro_ficha_existente: pacienteExistente[0].nro_ficha
      });
    }

    // ============================================
    // PROCESAR DATOS
    // ============================================

    // Generar número de ficha único
    const [ultimaFicha]: any = await pool.query(
      'SELECT MAX(nro_ficha) as ultima_ficha FROM paciente'
    );
    const nroFicha = (ultimaFicha[0]?.ultima_ficha || 0) + 1;

    // Procesar obra social - obligatoria según la estructura
    const mutualFinal = mutual && mutual.trim() ? mutual.trim() : 'Particular';

    // Procesar teléfono (debe ser INT según la estructura)
    const telefonoFinal = telefono && telefono.trim() ? limpiarTelefono(telefono) : null;

    // Procesar nro_afiliado (debe ser INT según la estructura)
    const nroAfiliadoFinal = nro_afiliado && nro_afiliado.trim() ? 
      parseInt(nro_afiliado.replace(/\D/g, '')) || null : null;

    // Procesar grupo sanguíneo - obligatorio según la estructura
    const grupoSanguineoFinal = grupo_sanguineo && grupo_sanguineo.trim() ? 
      grupo_sanguineo.trim() : 'ND';

    // Procesar dirección
    const direccionFinal = direccion && direccion.trim() ? direccion.trim() : null;

    // ============================================
    // INSERTAR EN BASE DE DATOS - ESTRUCTURA CORRECTA
    // ============================================

    const [resultado]: any = await pool.query(
      `INSERT INTO paciente (
        nro_ficha,
        Nombre_paciente,
        Apellido_paciente,
        fecha_alta,
        fecha_nacimiento,
        edad,
        sexo,
        estado,
        mutual,
        nro_afiliado,
        grupo_sanguineo,
        DNI,
        CP,
        direccion,
        telefono
      ) VALUES (?, ?, ?, CURDATE(), ?, ?, ?, 'activo', ?, ?, ?, ?, NULL, ?, ?)`,
      [
        nroFicha,
        nombre.trim(),
        apellido.trim(),
        fecha_nacimiento,
        edad,
        sexo.toUpperCase(),
        mutualFinal,
        nroAfiliadoFinal,
        grupoSanguineoFinal,
        dni,
        direccionFinal,
        telefonoFinal
      ]
    );

    console.log('✅ Paciente registrado exitosamente:', nombre, apellido, 'Ficha:', nroFicha);

    // Log de obra social personalizada si es nueva
    const obrasSocialesComunes = [
      "OSDE", "Swiss Medical", "Galeno", "Medicus", "IOMA", 
      "PAMI", "OSECAC", "OSPLAD", "Accord Salud", "Sancor Salud", "Particular"
    ];

    if (mutualFinal && !obrasSocialesComunes.includes(mutualFinal)) {
      console.log('🏥 Obra social personalizada registrada:', mutualFinal);
    }

    // ============================================
    // RESPUESTA EXITOSA
    // ============================================

    return res.status(201).json({
      success: true,
      message: 'Paciente registrado exitosamente',
      nro_ficha: nroFicha,
      paciente: {
        nro_ficha: nroFicha,
        dni: dni,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        edad: edad,
        sexo: sexo.toUpperCase(),
        mutual: mutualFinal,
        fecha_alta: new Date().toISOString().split('T')[0]
      }
    });

  } catch (error: any) {
    console.error('💥 ERROR al registrar paciente:', error);
    
    // Manejar errores específicos de MySQL
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un paciente con estos datos'
      });
    }

    if (error.code === 'ER_DATA_TOO_LONG') {
      return res.status(400).json({
        success: false,
        message: 'Uno de los campos contiene demasiados caracteres'
      });
    }

    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({
        success: false,
        message: 'Error en la estructura de la base de datos'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al registrar el paciente',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Buscar paciente por DNI - CORREGIDO
export const buscarPacientePorDNI = async (req: Request, res: Response) => {
  const dni = parseInt(req.params.dni);

  try {
    console.log('🔍 Buscando paciente con DNI:', dni);

    if (!dni || dni <= 0) {
      return res.status(400).json({
        success: false,
        message: 'DNI inválido'
      });
    }

    const [pacienteRows]: any = await pool.query(
      `SELECT 
        nro_ficha,
        Nombre_paciente as nombre,
        Apellido_paciente as apellido,
        DNI as dni,
        fecha_nacimiento,
        edad,
        sexo,
        telefono,
        direccion,
        mutual,
        nro_afiliado,
        grupo_sanguineo,
        estado,
        fecha_alta
       FROM paciente 
       WHERE DNI = ? AND (estado IS NULL OR estado != 'inactivo')
       LIMIT 1`,
      [dni]
    );

    if (pacienteRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró paciente con ese DNI'
      });
    }

    const paciente = pacienteRows[0];

    console.log('✅ Paciente encontrado:', paciente.nombre, paciente.apellido);

    return res.status(200).json({
      success: true,
      paciente: paciente
    });

  } catch (error) {
    console.error('💥 ERROR al buscar paciente:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al buscar paciente'
    });
  }
};

// Buscar obras sociales personalizadas - CORREGIDO
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
      `SELECT DISTINCT mutual as obra_social, COUNT(*) as uso_count
       FROM paciente 
       WHERE mutual IS NOT NULL 
       AND mutual != '' 
       AND mutual LIKE ?
       AND mutual NOT IN (${obrasSocialesComunes.map(() => '?').join(',')})
       GROUP BY mutual
       ORDER BY uso_count DESC, mutual ASC
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

// Buscar pacientes por DNI parcial - CORREGIDO  
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
        Nombre_paciente as nombre,
        Apellido_paciente as apellido,
        DNI as dni,
        fecha_nacimiento,
        edad,
        sexo,
        telefono,
        direccion,
        mutual,
        nro_afiliado,
        grupo_sanguineo
       FROM paciente 
       WHERE DNI LIKE ?
       AND (estado IS NULL OR estado != 'inactivo')
       ORDER BY DNI ASC
       LIMIT 20`,
      [`${dniParcial}%`]
    );

    console.log('✅ Pacientes encontrados:', pacientesRows.length);

    return res.status(200).json({
      success: true,
      pacientes: pacientesRows,
      total: pacientesRows.length
    });

  } catch (error) {
    console.error('💥 ERROR al buscar pacientes:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al buscar pacientes'
    });
  }
};

export default {
  registrarNuevoPaciente,
  buscarPacientePorDNI,
  buscarObrasSociales,
  buscarPacientesPorDNIParcial
};