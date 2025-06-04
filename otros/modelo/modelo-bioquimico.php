<?php
require_once 'conexion.php';

class Modelo_Bioquimico extends conexionBD {

    /**
     * Lista los bioquímicos para la tabla
     * @return array Datos de bioquímicos
     */
    public function listarBioquimicos() {
        $c = conexionBD::conexionPDO();
        $sql = "SELECT 
                Matricula_profesional, 
                Nombre_bq, 
                Apellido_bq,
                CASE WHEN Matricula_profesional > 0 THEN 'activo' ELSE 'inactivo' END as estatus
                FROM bioquimico 
                ORDER BY Apellido_bq, Nombre_bq";
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
     * Registra un nuevo bioquímico
     * @param int $matricula Matrícula profesional
     * @param string $nombre Nombre del bioquímico
     * @param string $apellido Apellido del bioquímico
     * @return int 1 si fue exitoso, 0 si falló, -1 si ya existe un bioquímico con esa matrícula
     */
    public function registrarBioquimico($matricula, $nombre, $apellido) {
        try {
            $c = conexionBD::conexionPDO();
            
            // Verificar si ya existe un bioquímico con la misma matrícula
            $sql_verificar = "SELECT COUNT(*) FROM bioquimico WHERE Matricula_profesional = ?";
            $query_verificar = $c->prepare($sql_verificar);
            $query_verificar->bindParam(1, $matricula);
            $query_verificar->execute();
            $existe = $query_verificar->fetchColumn();
            
            if ($existe > 0) {
                return -1; // Bioquímico con esta matrícula ya existe
            }
            
            $sql = "INSERT INTO bioquimico (Matricula_profesional, Nombre_bq, Apellido_bq) 
                    VALUES (?, ?, ?)";
            $query = $c->prepare($sql);
            $query->bindParam(1, $matricula);
            $query->bindParam(2, $nombre);
            $query->bindParam(3, $apellido);
            $resultado = $query->execute();
            
            if ($resultado) {
                return 1;
            } else {
                return 0;
            }
        } catch (Exception $e) {
            return 0;
        }
    }
    
    /**
     * Modifica los datos de un bioquímico
     * @param int $matricula_original Matrícula original del bioquímico
     * @param int $matricula_nueva Nueva matrícula del bioquímico
     * @param string $nombre Nombre del bioquímico
     * @param string $apellido Apellido del bioquímico
     * @return int 1 si fue exitoso, 0 si falló, -1 si ya existe otro bioquímico con esa matrícula
     */
    public function modificarBioquimico($matricula_original, $matricula_nueva, $nombre, $apellido) {
        try {
            $c = conexionBD::conexionPDO();
            
            // Si la matrícula cambió, verificar que no exista otro bioquímico con la nueva matrícula
            if ($matricula_original != $matricula_nueva) {
                $sql_verificar = "SELECT COUNT(*) FROM bioquimico WHERE Matricula_profesional = ?";
                $query_verificar = $c->prepare($sql_verificar);
                $query_verificar->bindParam(1, $matricula_nueva);
                $query_verificar->execute();
                $existe = $query_verificar->fetchColumn();
                
                if ($existe > 0) {
                    return -1; // Ya existe otro bioquímico con esa matrícula
                }
                
                // Si la matrícula cambió y es clave primaria, debemos usar una estrategia diferente
                // Primero insertar el nuevo registro y luego eliminar el antiguo
                $sql_insert = "INSERT INTO bioquimico (Matricula_profesional, Nombre_bq, Apellido_bq) 
                              VALUES (?, ?, ?)";
                $query_insert = $c->prepare($sql_insert);
                $query_insert->bindParam(1, $matricula_nueva);
                $query_insert->bindParam(2, $nombre);
                $query_insert->bindParam(3, $apellido);
                
                // Comenzar transacción
                $c->beginTransaction();
                
                $resultado_insert = $query_insert->execute();
                
                if ($resultado_insert) {
                    // Actualizar órdenes que referencian a este bioquímico
                    $sql_update_ordenes = "UPDATE orden SET id_bq_efectua = ? WHERE id_bq_efectua = ?";
                    $query_update_ordenes = $c->prepare($sql_update_ordenes);
                    $query_update_ordenes->bindParam(1, $matricula_nueva);
                    $query_update_ordenes->bindParam(2, $matricula_original);
                    $resultado_update_ordenes = $query_update_ordenes->execute();
                    
                    // Eliminar el registro antiguo
                    $sql_delete = "DELETE FROM bioquimico WHERE Matricula_profesional = ?";
                    $query_delete = $c->prepare($sql_delete);
                    $query_delete->bindParam(1, $matricula_original);
                    $resultado_delete = $query_delete->execute();
                    
                    if ($resultado_update_ordenes && $resultado_delete) {
                        $c->commit();
                        return 1;
                    } else {
                        $c->rollBack();
                        return 0;
                    }
                } else {
                    $c->rollBack();
                    return 0;
                }
            } else {
                // Si la matrícula no cambió, simplemente actualizar nombre y apellido
                $sql = "UPDATE bioquimico SET 
                        Nombre_bq = ?, 
                        Apellido_bq = ?
                        WHERE Matricula_profesional = ?";
                $query = $c->prepare($sql);
                $query->bindParam(1, $nombre);
                $query->bindParam(2, $apellido);
                $query->bindParam(3, $matricula_original);
                $resultado = $query->execute();
                
                if ($resultado) {
                    return 1;
                } else {
                    return 0;
                }
            }
        } catch (Exception $e) {
            // Si hubo una excepción durante la transacción, asegurarse de hacer rollback
            if ($c->inTransaction()) {
                $c->rollBack();
            }
            return 0;
        }
    }
    
    /**
     * Lista bioquímicos para los selects
     * @return array Lista de bioquímicos
     */
    public function listarSelectBioquimico() {
        $c = conexionBD::conexionPDO();
        $sql = "SELECT 
                    Matricula_profesional,
                    CONCAT(Apellido_bq, ' ', Nombre_bq, ' (MP: ', Matricula_profesional, ')') as bioquimico
                FROM bioquimico
                ORDER BY Apellido_bq, Nombre_bq";
        $query = $c->prepare($sql);
        $query->execute();
        $resultado = $query->fetchAll(PDO::FETCH_BOTH);
        
        return $resultado;
    }
}
?>