// src/controllers/paciente.controller.ts

import { Request, Response } from 'express';
import { pool } from '../routes/db'; 

// ============================================
// 1. FUNCIONES AUXILIARES
// ============================================

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

const limpiarTelefono = (telefono: string): number | null => {
  if (!telefono) return null;
  const numeroLimpio = telefono.toString().replace(/\D/g, '');
  return numeroLimpio.length >= 6 ? parseInt(numeroLimpio) : null;
};

// ============================================
// 2. GESTIÓN DE PACIENTES (CRUD)
// ============================================

// Obtener Ficha Completa (Para el Modal de Detalles)
export const buscarPacientePorFicha = async (req: Request, res: Response) => {
    const { nro_ficha } = req.params;
    try {
        const [rows]: any = await pool.query("SELECT * FROM paciente WHERE nro_ficha = ?", [nro_ficha]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Paciente no encontrado" });
        }
        
        const p = rows[0];

        // Mapeo seguro para compatibilidad con el Frontend
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
            provincia: p.provincia,
            email: p.email,
            mutual: p.mutual,
            nro_afiliado: p.nro_afiliado,
            grupo_sanguineo: p.grupo_sanguineo,
            factor: p.factor,
            antecedentes: p.antecedentes,
            observaciones: p.observaciones
        };

        return res.json({ success: true, paciente: pacienteFormateado });
    } catch (error: any) {
        console.error("Error buscarPacientePorFicha:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Registrar Nuevo Paciente
export const registrarNuevoPaciente = async (req: Request, res: Response) => {
    const { 
        nombre, apellido, dni, fecha_nacimiento, sexo, 
        telefono, email, direccion, mutual, nro_afiliado, grupo_sanguineo 
    } = req.body;

    try {
        const query = `
            INSERT INTO paciente 
            (Nombre_paciente, Apellido_paciente, DNI, fecha_nacimiento, sexo, telefono, email, direccion, mutual, nro_afiliado, grupo_sanguineo, estado, fecha_alta) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo', CURDATE())
        `;
        
        const [result]: any = await pool.query(query, [
            nombre, apellido, dni, fecha_nacimiento, sexo, 
            telefono, email, direccion, mutual, nro_afiliado, grupo_sanguineo
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

// Actualizar Paciente
export const actualizarPaciente = async (req: Request, res: Response) => {
  const nroFicha = parseInt(req.params.nro_ficha);
  const { dni, nombre, apellido, fecha_nacimiento, sexo, telefono, direccion, email, mutual, nro_afiliado, grupo_sanguineo, observaciones } = req.body;

  try {
    const edad = calcularEdad(fecha_nacimiento);
    const telefonoFinal = limpiarTelefono(telefono);
    const mutualFinal = mutual || 'Particular';

    const [resultado]: any = await pool.query(
      `UPDATE paciente SET 
        Nombre_paciente = ?, Apellido_paciente = ?, fecha_nacimiento = ?, 
        edad = ?, sexo = ?, mutual = ?, nro_afiliado = ?, grupo_sanguineo = ?, 
        DNI = ?, direccion = ?, telefono = ?, email = ?, observaciones = ? 
       WHERE nro_ficha = ?`,
      [nombre, apellido, fecha_nacimiento, edad, sexo, mutualFinal, nro_afiliado, grupo_sanguineo, dni, direccion, telefonoFinal, email, observaciones, nroFicha]
    );

    if (resultado.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }
    return res.json({ success: true, message: 'Paciente actualizado correctamente' });
  } catch (error: any) {
    console.error("Error actualizarPaciente:", error);
    return res.status(500).json({ success: false, message: 'Error al actualizar paciente' });
  }
};

// ============================================
// 3. FUNCIONES DE BÚSQUEDA
// ============================================

// Buscar Pacientes Sugeridos (Dropdown)
export const buscarPacientesSugeridos = async (req: Request, res: Response) => {
    const { dni } = req.params;
    try {
        const [rows]: any = await pool.query("SELECT * FROM paciente WHERE DNI LIKE ? LIMIT 5", [`${dni}%`]);
        const pacientesFormateados = rows.map((p: any) => ({
            nro_ficha: p.nro_ficha,
            nombre: p.Nombre_paciente,
            apellido: p.Apellido_paciente,
            dni: p.DNI,
            edad: p.edad,
            sexo: p.sexo,
            mutual: p.mutual
        }));
        return res.json({ success: true, pacientes: pacientesFormateados });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// Buscar Obras Sociales (Autocomplete)
export const buscarObrasSociales = async (req: Request, res: Response) => {
  const textoBusqueda = req.params.texto;
  try {
    const [rows]: any = await pool.query(
        "SELECT DISTINCT mutual FROM paciente WHERE mutual LIKE ? LIMIT 10", 
        [`%${textoBusqueda}%`]
    );
    return res.json({ success: true, obras_sociales: rows.map((r:any) => r.mutual) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error buscando obras sociales" });
  }
};

// Búsqueda Exacta (Por DNI)
export const buscarPacienteExacto = async (req: Request, res: Response) => {
    const { dni } = req.params;
    try {
        const [rows]: any = await pool.query("SELECT * FROM paciente WHERE DNI = ?", [dni]);
        if (rows.length === 0) return res.status(404).json({ success: false });
        
        const p = rows[0];
        return res.json({ 
            success: true, 
            paciente: { 
                nro_ficha: p.nro_ficha, 
                nombre: p.Nombre_paciente, 
                apellido: p.Apellido_paciente, 
                dni: p.DNI, 
                edad: p.edad, 
                mutual: p.mutual 
            } 
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// Alias para compatibilidad de rutas
export const buscarPacientePorDni = buscarPacienteExacto;
export const buscarPacientesPorDNIParcial = buscarPacientesSugeridos;

// ============================================
// 4. BÚSQUEDA AVANZADA (CORREGIDA PARA QUE SALGAN LOS DATOS)
// ============================================

export const getAllPacientes = async (req: Request, res: Response) => {
    // 1. Obtener parámetros de forma segura
    const buscar = (req.query.buscar as string || '').trim();
    const mutual = (req.query.mutual as string || 'todos');
    const sexo = (req.query.sexo as string || 'todos');
    const orden = (req.query.orden as string || 'reciente');
    
    const pagina = parseInt(req.query.pagina as string) || 1;
    const limite = parseInt(req.query.limite as string) || 20;
    const offset = (pagina - 1) * limite;

    try {
        // 2. Construir Query Dinámica
        let sqlBase = `
            SELECT p.*, 
            (SELECT COUNT(*) FROM orden o WHERE o.nro_ficha_paciente = p.nro_ficha) as total_ordenes,
            (SELECT MAX(fecha_ingreso_orden) FROM orden o WHERE o.nro_ficha_paciente = p.nro_ficha) as ultima_orden
            FROM paciente p
            WHERE 1=1
        `;
        
        const params: any[] = [];

        // 3. Aplicar Filtros
        if (buscar) {
            sqlBase += ` AND (p.Nombre_paciente LIKE ? OR p.Apellido_paciente LIKE ? OR p.DNI LIKE ?)`;
            params.push(`%${buscar}%`, `%${buscar}%`, `%${buscar}%`);
        }

        if (mutual !== 'todos') {
            sqlBase += ` AND p.mutual = ?`;
            params.push(mutual);
        }

        if (sexo !== 'todos') {
            sqlBase += ` AND p.sexo = ?`;
            params.push(sexo);
        }

        // 4. Calcular Total (para paginación)
        let countSql = `SELECT COUNT(*) as total FROM paciente p WHERE 1=1`;
        if (buscar) countSql += ` AND (p.Nombre_paciente LIKE ? OR p.Apellido_paciente LIKE ? OR p.DNI LIKE ?)`;
        if (mutual !== 'todos') countSql += ` AND p.mutual = ?`;
        if (sexo !== 'todos') countSql += ` AND p.sexo = ?`;
        
        const [totalRows]: any = await pool.query(countSql, params);
        const totalPacientes = totalRows[0].total;

        // 5. Aplicar Ordenamiento
        switch (orden) {
            case 'nombre': sqlBase += ` ORDER BY p.Apellido_paciente ASC, p.Nombre_paciente ASC`; break;
            case 'edad_desc': sqlBase += ` ORDER BY p.edad DESC`; break;
            case 'edad_asc': sqlBase += ` ORDER BY p.edad ASC`; break;
            case 'mas_ordenes': sqlBase += ` ORDER BY total_ordenes DESC`; break;
            default: sqlBase += ` ORDER BY p.nro_ficha DESC`; // 'reciente'
        }

        // 6. Aplicar Paginación
        sqlBase += ` LIMIT ? OFFSET ?`;
        params.push(limite, offset);

        // 7. Ejecutar Query Principal
        const [rows]: any = await pool.query(sqlBase, params);

        // 8. Formatear Respuesta (CORRECCIÓN CRÍTICA AQUÍ)
        // Usamos '||' para leer mayúsculas O minúsculas. Así no sale vacío.
        const pacientesFormateados = rows.map((p: any) => ({
            nro_ficha: p.nro_ficha,
            nombre: p.Nombre_paciente || p.nombre_paciente || p.nombre || "S/D",
            apellido: p.Apellido_paciente || p.apellido_paciente || p.apellido || "",
            dni: p.DNI || p.dni || 0,
            fecha_nacimiento: p.fecha_nacimiento,
            edad: p.edad,
            sexo: p.sexo,
            mutual: p.mutual,
            nro_afiliado: p.nro_afiliado,
            total_ordenes: p.total_ordenes || 0,
            ultima_orden: p.ultima_orden
        }));

        res.json({
            success: true,
            pacientes: pacientesFormateados,
            total: totalPacientes,
            pagina_actual: pagina,
            total_paginas: Math.ceil(totalPacientes / limite)
        });

    } catch (error: any) {
        console.error("Error en getAllPacientes:", error);
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
    getAllPacientes // ✅ Exportamos getAllPacientes (no Admin)
};