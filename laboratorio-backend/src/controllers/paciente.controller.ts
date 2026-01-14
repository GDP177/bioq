// src/controllers/paciente.controller.ts

import { Request, Response } from 'express';
import { pool } from '../routes/db'; // Asegúrate de que esta ruta sea correcta para tu proyecto

// --- FUNCIONES AUXILIARES ---
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

// --- CONTROLADORES PRINCIPALES ---

// 1. OBTENER FICHA COMPLETA (Para el Modal)
export const buscarPacientePorFicha = async (req: Request, res: Response) => {
    const { nro_ficha } = req.params;
    try {
        const [rows]: any = await pool.query("SELECT * FROM paciente WHERE nro_ficha = ?", [nro_ficha]);
        
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Paciente no encontrado" });
        
        const p = rows[0];

        // Mapeo seguro para el frontend
        const pacienteFormateado = {
            nro_ficha: p.nro_ficha,
            nombre: p.Nombre_paciente,     // Mapeo crucial
            apellido: p.Apellido_paciente, // Mapeo crucial
            dni: p.DNI,
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
        return res.status(500).json({ success: false, error: error.message });
    }
};

// 2. REGISTRAR
export const registrarNuevoPaciente = async (req: Request, res: Response) => {
    const { nombre, apellido, dni, fecha_nacimiento, sexo, telefono, email, direccion, mutual, nro_afiliado, grupo_sanguineo } = req.body;
    try {
        const query = `
            INSERT INTO paciente (Nombre_paciente, Apellido_paciente, DNI, fecha_nacimiento, sexo, telefono, email, direccion, mutual, nro_afiliado, grupo_sanguineo, estado, fecha_alta) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo', CURDATE())
        `;
        const [result]: any = await pool.query(query, [nombre, apellido, dni, fecha_nacimiento, sexo, telefono, email, direccion, mutual, nro_afiliado, grupo_sanguineo]);
        return res.status(201).json({ success: true, nro_ficha: result.insertId });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 3. ACTUALIZAR
export const actualizarPaciente = async (req: Request, res: Response) => {
  const nroFicha = parseInt(req.params.nro_ficha);
  const { dni, nombre, apellido, fecha_nacimiento, sexo, telefono, direccion, email, mutual, nro_afiliado, grupo_sanguineo, observaciones } = req.body;

  try {
    const edad = calcularEdad(fecha_nacimiento);
    const telefonoFinal = limpiarTelefono(telefono);
    const mutualFinal = mutual || 'Particular';

    const [resultado]: any = await pool.query(
      `UPDATE paciente SET Nombre_paciente = ?, Apellido_paciente = ?, fecha_nacimiento = ?, edad = ?, sexo = ?, mutual = ?, nro_afiliado = ?, grupo_sanguineo = ?, DNI = ?, direccion = ?, telefono = ?, email = ?, observaciones = ? WHERE nro_ficha = ?`,
      [nombre, apellido, fecha_nacimiento, edad, sexo, mutualFinal, nro_afiliado, grupo_sanguineo, dni, direccion, telefonoFinal, email, observaciones, nroFicha]
    );

    if (resultado.affectedRows === 0) return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    return res.json({ success: true, message: 'Paciente actualizado' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Error al actualizar' });
  }
};

// 4. BÚSQUEDA SUGERIDA
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

export const buscarObrasSociales = async (req: Request, res: Response) => {
  const textoBusqueda = req.params.texto;
  try {
    const [rows]: any = await pool.query("SELECT DISTINCT mutual FROM paciente WHERE mutual LIKE ? LIMIT 10", [`%${textoBusqueda}%`]);
    return res.json({ success: true, obras_sociales: rows.map((r:any) => r.mutual) });
  } catch (error) {
    return res.status(500).json({ success: false });
  }
};

export const buscarPacienteExacto = async (req: Request, res: Response) => {
    const { dni } = req.params;
    try {
        const [rows]: any = await pool.query("SELECT * FROM paciente WHERE DNI = ?", [dni]);
        if (rows.length === 0) return res.status(404).json({ success: false });
        const p = rows[0];
        return res.json({ success: true, paciente: { nro_ficha: p.nro_ficha, nombre: p.Nombre_paciente, apellido: p.Apellido_paciente, dni: p.DNI, edad: p.edad, mutual: p.mutual } });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const buscarPacientePorDni = buscarPacienteExacto;
export const buscarPacientesPorDNIParcial = buscarPacientesSugeridos;

export default { registrarNuevoPaciente, actualizarPaciente, buscarPacientePorFicha, buscarPacientesSugeridos, buscarObrasSociales, buscarPacientePorDni, buscarPacienteExacto };