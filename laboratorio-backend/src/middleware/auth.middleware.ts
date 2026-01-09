
// laboratorio-backend/src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';

/**
 * 🛡️ Middleware de Seguridad
 * Verifica si el usuario tiene los permisos necesarios para acceder.
 */
export const verificarRol = (rolesPermitidos: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log(`🛡️  ADMIN: Verificando acceso para roles: [${rolesPermitidos.join(', ')}]`);

    // NOTA: Para permitir el desarrollo inicial, simulamos un usuario administrador.
    // En el futuro, aquí es donde validaremos el TOKEN JWT.
    const usuarioSimulado = {
      id: 1,
      username: 'admin_test',
      rol: 'admin'
    };

    if (rolesPermitidos.includes(usuarioSimulado.rol)) {
      console.log(`✅ Acceso concedido: El rol '${usuarioSimulado.rol}' es válido`);
      next();
    } else {
      console.log(`❌ Acceso denegado: El rol '${usuarioSimulado.rol}' no tiene permisos`);
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos suficientes para acceder a esta sección'
      });
    }
  };
};

/**
 * 🔑 Middleware para autenticación básica de Token (Opcional por ahora)
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  console.log('🔑 Verificando token de acceso...');
  next();
};