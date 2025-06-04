<?php
require_once 'conexion.php';

class Modelo_Usuario extends conexionBD {
    
    /**
     * Verifica las credenciales de un usuario
     * @param string $usuario Nombre de usuario
     * @param string $clave Contraseña del usuario
     * @return array|bool Datos del usuario si las credenciales son correctas, false en caso contrario
     */
    public function verificarUsuario($usuario, $clave) {
        try {
            $c = conexionBD::conexionPDO();
            
            // Consulta para verificar usuario
            $sql = "SELECT * FROM usuario WHERE usu_nombre = ?";
            $query = $c->prepare($sql);
            $query->bindParam(1, $usuario);
            $query->execute();
            $data = $query->fetch(PDO::FETCH_ASSOC);
            
            // Si se encontró el usuario, verificar contraseña
            if ($data) {
                // Verificar si la contraseña coincide (usando password_verify si está hasheada)
                if (password_verify($clave, $data['usu_contrasena'])) {
                    return $data;
                } else {
                    // Si la contraseña está en texto plano (no recomendado pero por compatibilidad)
                    if ($clave === $data['usu_contrasena']) {
                        return $data;
                    }
                }
            }
            
            return false;
        } catch (Exception $e) {
            echo $e->getMessage();
            return false;
        }
    }
    
    /**
     * Lista los usuarios para el datatable
     * @return array Arreglo con datos de usuarios
     */
    public function listarUsuarios() {
        $c = conexionBD::conexionPDO();
        $sql = "SELECT 
                    usu_id,
                    usu_nombre,
                    usu_email,
                    usu_rol,
                    CASE 
                        WHEN usu_estatus = 'activo' THEN 'Activo'
                        ELSE 'Inactivo'
                    END as usu_estatus
                FROM usuario
                ORDER BY usu_nombre";
        $arreglo = array();
        $query = $c->prepare($sql);
        $query->execute();
        $resultado = $query->fetchAll(PDO::FETCH_ASSOC);
        
        foreach($resultado as $respuesta) {
            $arreglo["data"][] = $respuesta;
        }
        
        return $arreglo;
    }
    
    /**
     * Registra un nuevo usuario
     * @param string $nombre Nombre de usuario
     * @param string $email Email del usuario
     * @param string $clave Contraseña del usuario
     * @param string $rol Rol del usuario
     * @return int 1 si fue exitoso, 0 si falló, 2 si el usuario ya existe
     */
    public function registrarUsuario($nombre, $email, $clave, $rol) {
        try {
            $c = conexionBD::conexionPDO();
            
            // Verificar si ya existe un usuario con el mismo nombre
            $sql_verificar = "SELECT COUNT(*) FROM usuario WHERE usu_nombre = ?";
            $query_verificar = $c->prepare($sql_verificar);
            $query_verificar->bindParam(1, $nombre);
            $query_verificar->execute();
            $existe = $query_verificar->fetchColumn();
            
            if ($existe > 0) {
                return 2; // Usuario ya existe
            }
            
            // Hash de la contraseña
            $clave_hash = password_hash($clave, PASSWORD_DEFAULT);
            
            // Insertar usuario
            $sql = "INSERT INTO usuario (usu_nombre, usu_email, usu_contrasena, usu_rol, usu_estatus) 
                    VALUES (?, ?, ?, ?, 'activo')";
            $query = $c->prepare($sql);
            $query->bindParam(1, $nombre);
            $query->bindParam(2, $email);
            $query->bindParam(3, $clave_hash);
            $query->bindParam(4, $rol);
            $resultado = $query->execute();
            
            if ($resultado) {
                return 1;
            } else {
                return 0;
            }
        } catch (Exception $e) {
            echo $e->getMessage();
            return 0;
        }
    }
    
    /**
     * Modifica un usuario existente
     * @param int $id ID del usuario
     * @param string $email Email del usuario
     * @param string $rol Rol del usuario
     * @param string $estatus Estatus del usuario
     * @return int 1 si fue exitoso, 0 si falló
     */
    public function modificarUsuario($id, $email, $rol, $estatus) {
        try {
            $c = conexionBD::conexionPDO();
            
            $sql = "UPDATE usuario SET 
                    usu_email = ?, 
                    usu_rol = ?,
                    usu_estatus = ?
                    WHERE usu_id = ?";
            $query = $c->prepare($sql);
            $query->bindParam(1, $email);
            $query->bindParam(2, $rol);
            $query->bindParam(3, $estatus);
            $query->bindParam(4, $id);
            $resultado = $query->execute();
            
            if ($resultado) {
                return 1;
            } else {
                return 0;
            }
        } catch (Exception $e) {
            echo $e->getMessage();
            return 0;
        }
    }
    
    /**
     * Cambia la contraseña de un usuario
     * @param int $id ID del usuario
     * @param string $clave_nueva Nueva contraseña
     * @return int 1 si fue exitoso, 0 si falló
     */
    public function cambiarContrasena($id, $clave_nueva) {
        try {
            $c = conexionBD::conexionPDO();
            
            // Hash de la nueva contraseña
            $clave_hash = password_hash($clave_nueva, PASSWORD_DEFAULT);
            
            $sql = "UPDATE usuario SET usu_contrasena = ? WHERE usu_id = ?";
            $query = $c->prepare($sql);
            $query->bindParam(1, $clave_hash);
            $query->bindParam(2, $id);
            $resultado = $query->execute();
            
            if ($resultado) {
                return 1;
            } else {
                return 0;
            }
        } catch (Exception $e) {
            echo $e->getMessage();
            return 0;
        }
    }
}
?>