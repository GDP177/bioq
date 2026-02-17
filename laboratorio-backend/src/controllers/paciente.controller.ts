// src/controllers/paciente.controller.ts

import { Request, Response } from 'express';
import { pool } from '../routes/db'; 
import { executePaginatedQuery } from '../utils/queryHelpers'; 

// ============================================
// 1. FUNCIONES AUXILIARES
// ============================================

const calcularEdad = (fechaNacimiento: string): number => {
  if (!fechaNacimiento) return 0;
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return Math.max(0, edad);
};

const limpiarTelefono = (telefono: string): number | null => {
  if (!telefono) return null;
  const numeroLimpio = telefono.toString().replace(/\D/g, '');
  return numeroLimpio.length >= 6 ? parseInt(numeroLimpio) : null;
};

// ============================================
// 2. GESTIÓN DE PACIENTES (CRUD)
// ============================================

export const buscarPacientePorFicha = async (req: Request, res: Response) => {
    const { nro_ficha } = req.params;
    try {
        const query = `
            SELECT p.*, os.nombre as nombre_obra_social 
            FROM paciente p
            LEFT JOIN obra_social os ON p.id_obra_social = os.id_obra_social
            WHERE p.nro_ficha = ?`;

        const [rows]: any = await pool.query(query, [nro_ficha]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Paciente no encontrado" });
        }
        
        const p = rows[0];

        // Mapeo seguro para compatibilidad
        const pacienteFormateado = {
            nro_ficha: p.nro_ficha,
            nombre: p.Nombre_paciente || p.nombre_paciente, 
            apellido: p.Apellido_paciente || p.apellido_paciente, 
            dni: p.DNI || p.dni,
            fecha_nacimiento: p.fecha_nacimiento,
            edad: p.edad,
            sexo: p.sexo,
            telefono: p.telefono,
            direccion: p.direccion,
            localidad: p.localidad,
            email: p.email,
            id_obra_social: p.id_obra_social,
            mutual: p.nombre_obra_social || 'Particular',
            nro_afiliado: p.nro_afiliado,
            grupo_sanguineo: p.grupo_sanguineo,
            antecedentes: p.antecedentes,
            observaciones: p.observaciones
        };

        return res.json({ success: true, paciente: pacienteFormateado });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const registrarNuevoPaciente = async (req: Request, res: Response) => {
    const { 
        nombre, apellido, dni, fecha_nacimiento, sexo, 
        telefono, email, direccion, id_obra_social, nro_afiliado, grupo_sanguineo 
    } = req.body;

    try {
        const edad = calcularEdad(fecha_nacimiento);
        const obraSocialId = id_obra_social ? parseInt(id_obra_social) : null;

        const query = `
            INSERT INTO paciente 
            (Nombre_paciente, Apellido_paciente, DNI, fecha_nacimiento, edad, sexo, telefono, email, direccion, id_obra_social, nro_afiliado, grupo_sanguineo, estado, fecha_alta) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo', CURDATE())
        `;
        
        const [result]: any = await pool.query(query, [
            nombre, apellido, dni, fecha_nacimiento, edad, sexo, 
            telefono, email, direccion, obraSocialId, nro_afiliado, grupo_sanguineo
        ]);

        return res.status(201).json({ 
            success: true, 
            message: "Paciente registrado exitosamente",
            nro_ficha: result.insertId 
        });
    } catch (error: any) {
        console.error("Error registrarNuevoPaciente:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const actualizarPaciente = async (req: Request, res: Response) => {
  const nroFicha = parseInt(req.params.nro_ficha);
  const { dni, nombre, apellido, fecha_nacimiento, sexo, telefono, direccion, email, id_obra_social, nro_afiliado, grupo_sanguineo, observaciones } = req.body;

  try {
    const edad = calcularEdad(fecha_nacimiento);
    const telefonoFinal = limpiarTelefono(telefono);
    const obraSocialId = id_obra_social ? parseInt(id_obra_social) : null;

    const [resultado]: any = await pool.query(
      `UPDATE paciente SET 
        Nombre_paciente = ?, Apellido_paciente = ?, fecha_nacimiento = ?, 
        edad = ?, sexo = ?, id_obra_social = ?, nro_afiliado = ?, grupo_sanguineo = ?, 
        DNI = ?, direccion = ?, telefono = ?, email = ?, observaciones = ? 
       WHERE nro_ficha = ?`,
      [nombre, apellido, fecha_nacimiento, edad, sexo, obraSocialId, nro_afiliado, grupo_sanguineo, dni, direccion, telefonoFinal, email, observaciones, nroFicha]
    );

    if (resultado.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }
    return res.json({ success: true, message: 'Paciente actualizado correctamente' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Error al actualizar paciente' });
  }
};

// ============================================
// 3. FUNCIONES DE BÚSQUEDA
// ============================================

export const buscarPacientesSugeridos = async (req: Request, res: Response) => {
    const { dni } = req.params;
    try {
        const query = `
            SELECT p.nro_ficha, p.Nombre_paciente, p.Apellido_paciente, p.DNI, p.edad, os.nombre as mutual 
            FROM paciente p
            LEFT JOIN obra_social os ON p.id_obra_social = os.id_obra_social
            WHERE p.DNI LIKE ? LIMIT 5`;
            
        const [rows]: any = await pool.query(query, [`${dni}%`]);
        
        // Mapeo seguro también aquí
        const rowsFixed = rows.map((r: any) => ({
            ...r,
            Nombre_paciente: r.Nombre_paciente || r.nombre_paciente,
            Apellido_paciente: r.Apellido_paciente || r.apellido_paciente,
            DNI: r.DNI || r.dni
        }));
        
        return res.json({ success: true, pacientes: rowsFixed });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const buscarObrasSociales = async (req: Request, res: Response) => {
  const textoBusqueda = req.params.texto || '';
  try {
    // Si no hay texto, trae todas (útil para el select del filtro)
    const sql = textoBusqueda 
        ? "SELECT id_obra_social, nombre FROM obra_social WHERE nombre LIKE ? AND activo = 1 LIMIT 10"
        : "SELECT id_obra_social, nombre FROM obra_social WHERE activo = 1 ORDER BY nombre ASC";
    
    const params = textoBusqueda ? [`%${textoBusqueda}%`] : [];

    const [rows]: any = await pool.query(sql, params);
    return res.json({ success: true, obras_sociales: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error buscando obras sociales" });
  }
};

export const buscarPacienteExacto = async (req: Request, res: Response) => {
    const { dni } = req.params;
    try {
        const query = `
            SELECT p.*, os.nombre as nombre_obra_social 
            FROM paciente p
            LEFT JOIN obra_social os ON p.id_obra_social = os.id_obra_social
            WHERE p.DNI = ?`;

        const [rows]: any = await pool.query(query, [dni]);
        if (rows.length === 0) return res.status(404).json({ success: false });
        
        const p = rows[0];
        return res.json({ 
            success: true, 
            patient: { // Nota: 'patient' para compatibilidad con algunos frontends, revisar si usas 'paciente'
                nro_ficha: p.nro_ficha, 
                nombre: p.Nombre_paciente || p.nombre_paciente, 
                apellido: p.Apellido_paciente || p.apellido_paciente, 
                dni: p.DNI || p.dni, 
                edad: p.edad, 
                id_obra_social: p.id_obra_social,
                mutual: p.nombre_obra_social 
            },
            paciente: { // Versión en español por si acaso
                nro_ficha: p.nro_ficha, 
                nombre: p.Nombre_paciente || p.nombre_paciente, 
                apellido: p.Apellido_paciente || p.apellido_paciente, 
                dni: p.DNI || p.dni, 
                edad: p.edad, 
                id_obra_social: p.id_obra_social,
                mutual: p.nombre_obra_social 
            } 
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const buscarPacientePorDni = buscarPacienteExacto;
export const buscarPacientesPorDNIParcial = buscarPacientesSugeridos;

// ============================================
// 4. BÚSQUEDA AVANZADA (CORREGIDO Y ROBUSTO)
// ============================================

export const getAllPacientes = async (req: Request, res: Response) => {
    const { mutual, sexo, orden } = req.query;
    
    // 1. Base Query
    let baseQuery = `
        SELECT p.*, os.nombre as nombre_obra_social,
        (SELECT COUNT(*) FROM orden o WHERE o.nro_ficha_paciente = p.nro_ficha) as total_ordenes,
        (SELECT MAX(fecha_ingreso_orden) FROM orden o WHERE o.nro_ficha_paciente = p.nro_ficha) as ultima_orden
        FROM paciente p
        LEFT JOIN obra_social os ON p.id_obra_social = os.id_obra_social
    `;

    let countQuery = `
        SELECT COUNT(*) as total 
        FROM paciente p
        LEFT JOIN obra_social os ON p.id_obra_social = os.id_obra_social
    `;

    // 2. Condiciones
    const whereConditions: string[] = [];
    const params: any[] = [];

    // Filtro por Mutual (ahora busca por NOMBRE de mutual, que es lo que manda el select)
    if (mutual && mutual !== 'todos') {
        whereConditions.push('os.nombre = ?'); // Cambiado de p.id_obra_social a os.nombre
        params.push(mutual);
    }

    // Filtro por Sexo
    if (sexo && sexo !== 'todos') {
        whereConditions.push('p.sexo = ?');
        params.push(sexo);
    }

    // 3. Lógica de Ordenamiento
    let orderBySQL = 'ORDER BY p.nro_ficha DESC';
    if (orden === 'nombre') orderBySQL = 'ORDER BY p.Apellido_paciente ASC';
    if (orden === 'edad_desc') orderBySQL = 'ORDER BY p.edad DESC';
    if (orden === 'edad_asc') orderBySQL = 'ORDER BY p.edad ASC';
    if (orden === 'mas_ordenes') orderBySQL = 'ORDER BY total_ordenes DESC';

    // 4. Ejecución
    try {
        const result = await executePaginatedQuery({
            baseQuery, 
            countQuery,
            defaultTable: 'paciente',
            // Buscamos tanto por mayúscula como minúscula en el SQL por seguridad
            searchColumns: ['p.Nombre_paciente', 'p.Apellido_paciente', 'p.DNI'],
            queryParams: req.query,
            whereConditions,
            params,
            orderByClause: orderBySQL
        });

        // 5. Formateo ROBUSTO
        const pacientesFormateados = result.data.map((p: any) => ({
            nro_ficha: p.nro_ficha,
            // Leemos mayúsculas O minúsculas para asegurar que el dato llegue
            nombre: p.Nombre_paciente || p.nombre_paciente || "S/D",
            apellido: p.Apellido_paciente || p.apellido_paciente || "",
            dni: p.DNI || p.dni || 0,
            edad: p.edad,
            sexo: p.sexo,
            mutual: p.nombre_obra_social || 'Particular',
            nro_afiliado: p.nro_afiliado,
            total_ordenes: p.total_ordenes || 0,
            ultima_orden: p.ultima_orden
        }));

        res.json({
            success: true,
            pacientes: pacientesFormateados,
            total: result.meta.total,
            pagina_actual: result.meta.pagina_actual,
            total_paginas: result.meta.total_paginas
        });

    } catch (error: any) {
        console.error("Error getAllPacientes:", error);
        res.status(500).json({ success: false, message: "Error al obtener pacientes" });
    }
};

export default {
    registrarNuevoPaciente,
    actualizarPaciente,
    buscarPacientePorFicha,
    buscarPacientesSugeridos,
    buscarObrasSociales,
    buscarPacientePorDni,
    buscarPacienteExacto,
    getAllPacientes
};