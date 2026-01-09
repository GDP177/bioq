// laboratorio-backend/src/controllers/auth.controller.ts - CONTROLADOR UNIFICADO LIMPIO

import { Request, Response } from 'express';
import { pool } from '../routes/db';
import bcrypt from 'bcrypt';

// ============================================
// REGISTRO UNIFICADO
// ============================================
export const registrarUsuario = async (req: Request, res: Response) => {
  const { email, password, username, rol } = req.body;

  try {
    console.log(`📝 REGISTRO - Email: ${email}, Rol: ${rol}`);

    // 1. VALIDACIONES ESTRICTAS
    if (!email || !password || !username || !rol) {
      return res.status(400).json({ 
        success: false,
        message: "Faltan datos obligatorios: email, password, username y rol son requeridos" 
      });
    }

    // Validar rol específico
    const rolesValidos = ['medico', 'bioquimico', 'admin'];
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({ 
        success: false,
        message: "Rol inválido. Debe ser: medico, bioquimico o admin" 
      });
    }

    // Validar email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    // Validar contraseña (mínimo 4 caracteres)
    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 4 caracteres'
      });
    }

    // 2. VERIFICAR SI USUARIO YA EXISTE
    const [existingUsers]: any = await pool.query(
      'SELECT id_usuario FROM usuarios WHERE email = ? LIMIT 1',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // 3. CREAR USUARIO
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result]: any = await pool.query(
      `INSERT INTO usuarios (
        email, 
        password_hash, 
        username, 
        rol, 
        activo, 
        intentos_fallidos, 
        fecha_creacion
      ) VALUES (?, ?, ?, ?, 1, 0, NOW())`,
      [email, hashedPassword, username, rol]
    );

    const nuevoUsuarioId = result.insertId;

    console.log(`✅ Usuario registrado exitosamente: ${email} como ${rol} (ID: ${nuevoUsuarioId})`);

    // 4. RESPUESTA
    return res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente',
      usuario: {
        id_usuario: nuevoUsuarioId,
        email,
        username,
        rol,
        requiere_completar_perfil: rol !== 'admin'
      }
    });

  } catch (error: any) {
    console.error('💥 ERROR en registro:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ============================================
// LOGIN UNIFICADO
// ============================================
export const loginUnificado = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    console.log(`🔐 LOGIN UNIFICADO - Email: ${email}`);

    // 1. VALIDACIONES BÁSICAS
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email y contraseña son requeridos" 
      });
    }

    // 2. BUSCAR USUARIO EN BD
    const [userRows]: any = await pool.query(
      'SELECT * FROM usuarios WHERE email = ? AND activo = 1 LIMIT 1',
      [email]
    );

    if (userRows.length === 0) {
      console.log(`❌ Usuario no encontrado: ${email}`);
      return res.status(401).json({ 
        success: false,
        message: "Usuario no encontrado o inactivo" 
      });
    }

    const usuario = userRows[0];
    console.log(`👤 Usuario encontrado: ${email} - Rol: ${usuario.rol}`);

    // 3. VERIFICAR CONTRASEÑA CON BCRYPT
    const isPasswordValid = await bcrypt.compare(password, usuario.password_hash);
    
    if (!isPasswordValid) {
      console.log(`❌ Contraseña incorrecta para: ${email}`);
      return res.status(401).json({ 
        success: false,
        message: "Contraseña incorrecta" 
      });
    }

    console.log(`✅ Contraseña válida para: ${email}`);

    // 4. VERIFICAR PERFIL COMPLETO SEGÚN ROL
    let requierePerfil = false;
    let datosUsuario: any = {};

    switch (usuario.rol) {
      case 'medico':
        console.log('🏥 Procesando login de médico...');
        const [medicoRows]: any = await pool.query(
          'SELECT * FROM medico WHERE id_usuario = ? AND (activo IS NULL OR activo = 1) LIMIT 1',
          [usuario.id_usuario]
        );
        
        if (medicoRows.length === 0) {
          console.log('👤 Médico requiere completar perfil');
          requierePerfil = true;
          datosUsuario = {
            id_usuario: usuario.id_usuario,
            email: usuario.email,
            username: usuario.username,
            rol: usuario.rol
          };
        } else {
          const medico = medicoRows[0];
          console.log('✅ Médico con perfil completo');
          datosUsuario = {
            id: medico.id_medico,
            id_usuario: usuario.id_usuario,
            nombre: medico.nombre_medico,
            apellido: medico.apellido_medico,
            email: usuario.email,
            especialidad: medico.especialidad,
            matricula: medico.matricula_medica,
            telefono: medico.telefono,
            direccion: medico.direccion,
            rol: usuario.rol
          };
        }
        break;

      case 'bioquimico':
        console.log('🧬 Procesando login de bioquímico...');
        const [bioquimicoRows]: any = await pool.query(
          'SELECT * FROM bioquimico WHERE id_usuario = ? AND (activo IS NULL OR activo = 1) LIMIT 1',
          [usuario.id_usuario]
        );
        
        if (bioquimicoRows.length === 0) {
          console.log('👤 Bioquímico requiere completar perfil');
          requierePerfil = true;
          datosUsuario = {
            id_usuario: usuario.id_usuario,
            email: usuario.email,
            username: usuario.username,
            rol: usuario.rol
          };
        } else {
          const bioquimico = bioquimicoRows[0];
          console.log('✅ Bioquímico con perfil completo');
          datosUsuario = {
            id: bioquimico.matricula_profesional,
            id_usuario: usuario.id_usuario,
            nombre: bioquimico.nombre_bq,
            apellido: bioquimico.apellido_bq,
            email: usuario.email,
            matricula: bioquimico.matricula_profesional,
            dni: bioquimico.dni_bioquimico,
            telefono: bioquimico.telefono,
            direccion: bioquimico.direccion,
            fecha_habilitacion: bioquimico.fecha_habilitacion,
            fecha_vencimiento_matricula: bioquimico.fecha_vencimiento_matricula,
            rol: usuario.rol
          };
        }
        break;

      case 'admin':
        console.log('👑 Procesando login de administrador...');
        // Admin no requiere perfil adicional
        datosUsuario = {
          id: usuario.id_usuario,
          id_usuario: usuario.id_usuario,
          nombre: usuario.username,
          apellido: '',
          email: usuario.email,
          username: usuario.username,
          rol: usuario.rol
        };
        break;

      default:
        console.log(`❌ Rol no reconocido: ${usuario.rol}`);
        return res.status(403).json({
          success: false,
          message: 'Rol de usuario no reconocido'
        });
    }

    // 5. ACTUALIZAR ÚLTIMO ACCESO
    await pool.query(
      'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = ?', 
      [usuario.id_usuario]
    );

    // 6. RESPUESTA FINAL
    if (requierePerfil) {
      console.log(`👤 Usuario ${usuario.rol} requiere completar perfil`);
      return res.status(200).json({
        success: true,
        message: 'Login exitoso - Perfil incompleto',
        requiere_completar_perfil: true,
        usuario: datosUsuario
      });
    } else {
      console.log(`✅ Login completo para ${usuario.rol}:`, datosUsuario.nombre || datosUsuario.email);
      return res.status(200).json({
        success: true,
        message: 'Login exitoso',
        requiere_completar_perfil: false,
        usuario: datosUsuario
      });
    }

  } catch (error: any) {
    console.error('💥 ERROR en login unificado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ============================================
// MIDDLEWARES ÚTILES (OPCIONALES)
// ============================================

// Middleware para validar datos de login
export const validarDatosLogin = (req: Request, res: Response, next: any) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email y contraseña son requeridos'
    });
  }
  
  next();
};

// Middleware para validar datos de registro
export const validarDatosRegistro = (req: Request, res: Response, next: any) => {
  const { email, password, username, rol } = req.body;
  
  if (!email || !password || !username || !rol) {
    return res.status(400).json({
      success: false,
      message: 'Todos los campos son requeridos'
    });
  }
  
  const rolesValidos = ['medico', 'bioquimico', 'admin'];
  if (!rolesValidos.includes(rol)) {
    return res.status(400).json({
      success: false,
      message: 'Rol inválido'
    });
  }
  
  next();
};

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

// Función para verificar si un perfil está completo
export const verificarPerfilCompleto = async (idUsuario: number, rol: string): Promise<boolean> => {
  try {
    switch (rol) {
      case 'medico':
        const [medicoRows]: any = await pool.query(
          'SELECT id_medico FROM medico WHERE id_usuario = ? AND (activo IS NULL OR activo = 1)',
          [idUsuario]
        );
        return medicoRows.length > 0;
        
      case 'bioquimico':
        const [bioquimicoRows]: any = await pool.query(
          'SELECT matricula_profesional FROM bioquimico WHERE id_usuario = ? AND (activo IS NULL OR activo = 1)',
          [idUsuario]
        );
        return bioquimicoRows.length > 0;
        
      case 'admin':
        return true; // Admin no requiere perfil adicional
        
      default:
        return false;
    }
  } catch (error) {
    console.error('Error al verificar perfil completo:', error);
    return false;
  }
};



