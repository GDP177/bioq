<?php
require_once 'conexion.php';

class Modelo_Valor_Referencia extends conexionBD {

    /**
     * Lista los valores de referencia
     * @return array Datos de valores de referencia
     */
    public function listarValoresReferencia() {
        $c = conexionBD::conexionPDO();
        $sql = "SELECT 
                id_valor_ref, 
                valor_inicial_de_rango, 
                valor_final_de_rango, 
                unidad,
                tipo_persona
                FROM valor_referencia 
                ORDER BY id_valor_ref";
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
     * Registra un nuevo valor de referencia
     * @param float $valor_inicial Valor inicial del rango
     * @param float $valor_final Valor final del rango
     * @param string $unidad Unidad de medida
     * @param string $tipo_persona Tipo de persona (adulto, niño, embarazada, etc.)
     * @return int ID del valor de referencia o 0 si falló
     */
    public function registrarValorReferencia($valor_inicial, $valor_final, $unidad, $tipo_persona) {
        try {
            $c = conexionBD::conexionPDO();
            
            // Obtener el siguiente ID
            $sql_id = "SELECT MAX(id_valor_ref) + 1 FROM valor_referencia";
            $query_id = $c->prepare($sql_id);
            $query_id->execute();
            $nuevo_id = $query_id->fetchColumn();
            
            if (!$nuevo_id) {
                $nuevo_id = 1; // Si no hay valores, empezar desde 1
            }
            
            $sql = "INSERT INTO valor_referencia (id_valor_ref, valor_inicial_de_rango, valor_final_de_rango, unidad, tipo_persona) 
                    VALUES (?, ?, ?, ?, ?)";
            $query = $c->prepare($sql);
            $query->bindParam(1, $nuevo_id);
            $query->bindParam(2, $valor_inicial);
            $query->bindParam(3, $valor_final);
            $query->bindParam(4, $unidad);
            $query->bindParam(5, $tipo_persona);
            $resultado = $query->execute();
            
            if ($resultado) {
                return $nuevo_id;
            } else {
                return 0;
            }
        } catch (Exception $e) {
            return 0;
        }
    }
    
    /**
     * Modifica un valor de referencia existente
     * @param int $id ID del valor de referencia
     * @param float $valor_inicial Valor inicial del rango
     * @param float $valor_final Valor final del rango
     * @param string $unidad Unidad de medida
     * @param string $tipo_persona Tipo de persona
     * @return int 1 si fue exitoso, 0 si falló
     */
    public function modificarValorReferencia($id, $valor_inicial, $valor_final, $unidad, $tipo_persona) {
        try {
            $c = conexionBD::conexionPDO();
            
            $sql = "UPDATE valor_referencia SET 
                    valor_inicial_de_rango = ?, 
                    valor_final_de_rango = ?, 
                    unidad = ?,
                    tipo_persona = ?
                    WHERE id_valor_ref = ?";
            $query = $c->prepare($sql);
            $query->bindParam(1, $valor_inicial);
            $query->bindParam(2, $valor_final);
            $query->bindParam(3, $unidad);
            $query->bindParam(4, $tipo_persona);
            $query->bindParam(5, $id);
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
     * Elimina un valor de referencia
     * @param int $id ID del valor de referencia
     * @return int 1 si fue exitoso, 0 si falló, -1 si está en uso y no se puede eliminar
     */
    public function eliminarValorReferencia($id) {
        try {
            $c = conexionBD::conexionPDO();
            
            // Verificar si el valor está en uso (referenciado en la tabla 'tiene')
            $sql_verificar = "SELECT COUNT(*) FROM tiene WHERE id_valor_ref = ?";
            $query_verificar = $c->prepare($sql_verificar);
            $query_verificar->bindParam(1, $id);
            $query_verificar->execute();
            $en_uso = $query_verificar->fetchColumn();
            
            if ($en_uso > 0) {
                return -1; // No se puede eliminar porque está en uso
            }
            
            $sql = "DELETE FROM valor_referencia WHERE id_valor_ref = ?";
            $query = $c->prepare($sql);
            $query->bindParam(1, $id);
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
     * Asigna un valor de referencia a un análisis
     * @param int $codigo_practica Código de práctica (análisis)
     * @param int $id_valor_ref ID del valor de referencia
     * @return int 1 si fue exitoso, 0 si falló, -1 si ya está asignado
     */
    public function asignarValorReferenciaAnalisis($codigo_practica, $id_valor_ref) {
        try {
            $c = conexionBD::conexionPDO();
            
            // Verificar si ya está asignado
            $sql_verificar = "SELECT COUNT(*) FROM tiene WHERE CODIGO_DE_PRACTICA = ? AND id_valor_ref = ?";
            $query_verificar = $c->prepare($sql_verificar);
            $query_verificar->bindParam(1, $codigo_practica);
            $query_verificar->bindParam(2, $id_valor_ref);
            $query_verificar->execute();
            $ya_asignado = $query_verificar->fetchColumn();
            
            if ($ya_asignado > 0) {
                return -1; // Ya está asignado
            }
            
            // Asignar con valor_hallado inicialmente en 0
            $sql = "INSERT INTO tiene (CODIGO_DE_PRACTICA, id_valor_ref, valor_hallado) 
                    VALUES (?, ?, 0)";
            $query = $c->prepare($sql);
            $query->bindParam(1, $codigo_practica);
            $query->bindParam(2, $id_valor_ref);
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
     * Elimina la asignación de un valor de referencia a un análisis
     * @param int $codigo_practica Código de práctica (análisis)
     * @param int $id_valor_ref ID del valor de referencia
     * @return int 1 si fue exitoso, 0 si falló
     */
    public function desasignarValorReferenciaAnalisis($codigo_practica, $id_valor_ref) {
        try {
            $c = conexionBD::conexionPDO();
            
            $sql = "DELETE FROM tiene WHERE CODIGO_DE_PRACTICA = ? AND id_valor_ref = ?";
            $query = $c->prepare($sql);
            $query->bindParam(1, $codigo_practica);
            $query->bindParam(2, $id_valor_ref);
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
     * Obtiene los valores de referencia asignados a un análisis
     * @param int $codigo_practica Código de práctica (análisis)
     * @return array Valores de referencia asignados
     */
    public function obtenerValoresReferenciaAnalisis($codigo_practica) {
        $c = conexionBD::conexionPDO();
        $sql = "SELECT 
                t.CODIGO_DE_PRACTICA,
                t.id_valor_ref,
                vr.valor_inicial_de_rango,
                vr.valor_final_de_rango,
                vr.unidad,
                vr.tipo_persona,
                t.valor_hallado,
                t.unidad_valor_hallado
                FROM tiene t
                INNER JOIN valor_referencia vr ON t.id_valor_ref = vr.id_valor_ref
                WHERE t.CODIGO_DE_PRACTICA = ?";
        $query = $c->prepare($sql);
        $query->bindParam(1, $codigo_practica);
        $query->execute();
        $resultado = $query->fetchAll(PDO::FETCH_ASSOC);
        
        return $resultado;
    }
    
    /**
     * Lista los valores de referencia disponibles para selects
     * @return array Lista de valores de referencia
     */
    public function listarSelectValorReferencia() {
        $c = conexionBD::conexionPDO();
        $sql = "SELECT 
                id_valor_ref,
                CONCAT(tipo_persona, ': ', valor_inicial_de_rango, ' - ', valor_final_de_rango, ' ', unidad) as valor_referencia
                FROM valor_referencia
                ORDER BY tipo_persona, valor_inicial_de_rango";
        $query = $c->prepare($sql);
        $query->execute();
        $resultado = $query->fetchAll(PDO::FETCH_BOTH);
        
        return $resultado;
    }
}
?>