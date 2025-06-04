<?php
require_once 'conexion.php';

class Modelo_Orden extends conexionBD {

    /**
     * Lista las órdenes para la tabla
     * @return array Datos de órdenes
     */
    public function listarOrdenes() {
        $c = conexionBD::conexionPDO();
        $sql = "SELECT 
                o.id_orden, 
                o.urgente,
                CONCAT(p.Apellido_paciente, ' ', p.Nombre_paciente) as paciente,
                p.DNI,
                CONCAT(m.Apellido_medico, ' ', m.Nombre_medico) as medico_solicitante,
                CONCAT(b.Apellido_bq, ' ', b.Nombre_bq) as bioquimico,
                DATE_FORMAT(o.fecha_ingreso_orden, '%d/%m/%Y') as fecha_ingreso
                FROM orden o
                INNER JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
                INNER JOIN medico m ON o.id_medico_solicitante = m.idMedico
                LEFT JOIN bioquimico b ON o.id_bq_efectua = b.Matricula_profesional
                ORDER BY o.fecha_ingreso_orden DESC, o.urgente DESC";
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
     * Registra una nueva orden
     * @param int $urgente Si es urgente (1) o no (0)
     * @param int $id_medico ID del médico solicitante
     * @param int $id_bioquimico ID del bioquímico que efectúa
     * @param int $nro_ficha Número de ficha del paciente
     * @return int ID de la orden creada o 0 si falló
     */
    public function registrarOrden($urgente, $id_medico, $id_bioquimico, $nro_ficha) {
        try {
            $c = conexionBD::conexionPDO();
            
            // Obtener el siguiente ID de orden
            $sql_id = "SELECT MAX(id_orden) + 1 FROM orden";
            $query_id = $c->prepare($sql_id);
            $query_id->execute();
            $nuevo_id = $query_id->fetchColumn();
            
            if (!$nuevo_id) {
                $nuevo_id = 1; // Si no hay órdenes, empezar desde 1
            }
            
            // Fecha actual
            $fecha = date('Y-m-d');
            
            $sql = "INSERT INTO orden (id_orden, urgente, id_medico_solicitante, id_bq_efectua, fecha_ingreso_orden, nro_ficha_paciente) 
                    VALUES (?, ?, ?, ?, ?, ?)";
            $query = $c->prepare($sql);
            $query->bindParam(1, $nuevo_id);
            $query->bindParam(2, $urgente);
            $query->bindParam(3, $id_medico);
            $query->bindParam(4, $id_bioquimico);
            $query->bindParam(5, $fecha);
            $query->bindParam(6, $nro_ficha);
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
     * Agrega un análisis a una orden
     * @param int $id_orden ID de la orden
     * @param int $codigo_practica Código de práctica (análisis)
     * @return int 1 si fue exitoso, 0 si falló, -1 si ya está asignado
     */
    public function agregarAnalisisOrden($id_orden, $codigo_practica) {
        try {
            $c = conexionBD::conexionPDO();
            
            // Verificar si ya está asignado
            $sql_verificar = "SELECT COUNT(*) FROM orden_has_analisis WHERE id_orden = ? AND Codigo_de_practica = ?";
            $query_verificar = $c->prepare($sql_verificar);
            $query_verificar->bindParam(1, $id_orden);
            $query_verificar->bindParam(2, $codigo_practica);
            $query_verificar->execute();
            $ya_asignado = $query_verificar->fetchColumn();
            
            if ($ya_asignado > 0) {
                return -1; // Ya está asignado
            }
            
            // Fecha actual por defecto nula (se completa cuando se realiza el análisis)
            $fecha_realizacion = null;
            
            $sql = "INSERT INTO orden_has_analisis (id_orden, Codigo_de_practica, fecha_realizacion_analisis) 
                    VALUES (?, ?, ?)";
            $query = $c->prepare($sql);
            $query->bindParam(1, $id_orden);
            $query->bindParam(2, $codigo_practica);
            $query->bindParam(3, $fecha_realizacion);
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
     * Elimina un análisis de una orden
     * @param int $id_orden ID de la orden
     * @param int $codigo_practica Código de práctica (análisis)
     * @return int 1 si fue exitoso, 0 si falló
     */
    public function eliminarAnalisisOrden($id_orden, $codigo_practica) {
        try {
            $c = conexionBD::conexionPDO();
            
            $sql = "DELETE FROM orden_has_analisis WHERE id_orden = ? AND Codigo_de_practica = ?";
            $query = $c->prepare($sql);
            $query->bindParam(1, $id_orden);
            $query->bindParam(2, $codigo_practica);
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
     * Obtiene los análisis asignados a una orden
     * @param int $id_orden ID de la orden
     * @return array Análisis asignados
     */
    public function obtenerAnalisisOrden($id_orden) {
        $c = conexionBD::conexionPDO();
        $sql = "SELECT 
                oa.id_orden,
                oa.Codigo_de_practica,
                a.DESCRIPCION_DE_PRACTICA,
                a.DESCRIPCION_DE_MODULO,
                oa.fecha_realizacion_analisis
                FROM orden_has_analisis oa
                INNER JOIN analisis a ON oa.Codigo_de_practica = a.CODIGO_DE_PRACTICA
                WHERE oa.id_orden = ?
                ORDER BY a.DESCRIPCION_DE_PRACTICA";
        $query = $c->prepare($sql);
        $query->bindParam(1, $id_orden);
        $query->execute();
        $resultado = $query->fetchAll(PDO::FETCH_ASSOC);
        
        return $resultado;
    }
    
    /**
     * Marca un análisis como realizado
     * @param int $id_orden ID de la orden
     * @param int $codigo_practica Código de práctica (análisis)
     * @return int 1 si fue exitoso, 0 si falló
     */
    public function marcarAnalisisRealizado($id_orden, $codigo_practica) {
        try {
            $c = conexionBD::conexionPDO();
            
            // Fecha actual
            $fecha = date('Y-m-d');
            
            $sql = "UPDATE orden_has_analisis SET fecha_realizacion_analisis = ? 
                    WHERE id_orden = ? AND Codigo_de_practica = ?";
            $query = $c->prepare($sql);
            $query->bindParam(1, $fecha);
            $query->bindParam(2, $id_orden);
            $query->bindParam(3, $codigo_practica);
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
     * Obtiene una orden con todos sus detalles
     * @param int $id_orden ID de la orden
     * @return array Datos de la orden
     */
    public function obtenerOrden($id_orden) {
        $c = conexionBD::conexionPDO();
        $sql = "SELECT 
                o.id_orden, 
                o.urgente,
                o.nro_ficha_paciente,
                CONCAT(p.Apellido_paciente, ' ', p.Nombre_paciente) as paciente,
                p.DNI,
                o.id_medico_solicitante,
                CONCAT(m.Apellido_medico, ' ', m.Nombre_medico) as medico_solicitante,
                o.id_bq_efectua,
                CONCAT(b.Apellido_bq, ' ', b.Nombre_bq) as bioquimico,
                DATE_FORMAT(o.fecha_ingreso_orden, '%d/%m/%Y') as fecha_ingreso
                FROM orden o
                INNER JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
                INNER JOIN medico m ON o.id_medico_solicitante = m.idMedico
                LEFT JOIN bioquimico b ON o.id_bq_efectua = b.Matricula_profesional
                WHERE o.id_orden = ?";
        $query = $c->prepare($sql);
        $query->bindParam(1, $id_orden);
        $query->execute();
        $resultado = $query->fetch(PDO::FETCH_ASSOC);
        
        return $resultado;
    }
    
    /**
     * Lista las órdenes pendientes (con análisis sin realizar)
     * @return array Órdenes pendientes
     */
    public function listarOrdenesPendientes() {
        $c = conexionBD::conexionPDO();
        $sql = "SELECT 
                o.id_orden, 
                o.urgente,
                CONCAT(p.Apellido_paciente, ' ', p.Nombre_paciente) as paciente,
                p.DNI,
                CONCAT(m.Apellido_medico, ' ', m.Nombre_medico) as medico_solicitante,
                DATE_FORMAT(o.fecha_ingreso_orden, '%d/%m/%Y') as fecha_ingreso
                FROM orden o
                INNER JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
                INNER JOIN medico m ON o.id_medico_solicitante = m.idMedico
                WHERE EXISTS (
                    SELECT 1 FROM orden_has_analisis oa 
                    WHERE oa.id_orden = o.id_orden 
                    AND oa.fecha_realizacion_analisis IS NULL
                )
                ORDER BY o.urgente DESC, o.fecha_ingreso_orden";
        $arreglo = array();
        $query = $c->prepare($sql);
        $query->execute();
        $resultado = $query->fetchAll(PDO::FETCH_ASSOC);
        
        foreach($resultado as $respuesta) {
            $arreglo[] = $respuesta;
        }
        
        return $arreglo;
    }
    
    /**
     * Registra un valor hallado para un análisis
     * @param int $codigo_practica Código de práctica (análisis)
     * @param int $id_valor_ref ID del valor de referencia
     * @param float $valor_hallado Valor hallado
     * @param string $unidad_valor_hallado Unidad del valor hallado
     * @return int 1 si fue exitoso, 0 si falló
     */
    public function registrarValorHallado($codigo_practica, $id_valor_ref, $valor_hallado, $unidad_valor_hallado) {
        try {
            $c = conexionBD::conexionPDO();
            
            // Verificar si ya existe la relación
            $sql_verificar = "SELECT COUNT(*) FROM tiene WHERE CODIGO_DE_PRACTICA = ? AND id_valor_ref = ?";
            $query_verificar = $c->prepare($sql_verificar);
            $query_verificar->bindParam(1, $codigo_practica);
            $query_verificar->bindParam(2, $id_valor_ref);
            $query_verificar->execute();
            $existe = $query_verificar->fetchColumn();
            
            if ($existe > 0) {
                // Actualizar
                $sql = "UPDATE tiene SET 
                        valor_hallado = ?,
                        unidad_valor_hallado = ?
                        WHERE CODIGO_DE_PRACTICA = ? AND id_valor_ref = ?";
                $query = $c->prepare($sql);
                $query->bindParam(1, $valor_hallado);
                $query->bindParam(2, $unidad_valor_hallado);
                $query->bindParam(3, $codigo_practica);
                $query->bindParam(4, $id_valor_ref);
                $resultado = $query->execute();
            } else {
                // Insertar
                $sql = "INSERT INTO tiene (CODIGO_DE_PRACTICA, id_valor_ref, valor_hallado, unidad_valor_hallado) 
                        VALUES (?, ?, ?, ?)";
                $query = $c->prepare($sql);
                $query->bindParam(1, $codigo_practica);
                $query->bindParam(2, $id_valor_ref);
                $query->bindParam(3, $valor_hallado);
                $query->bindParam(4, $unidad_valor_hallado);
                $resultado = $query->execute();
            }
            
            if ($resultado) {
                return 1;
            } else {
                return 0;
            }
        } catch (Exception $e) {
            return 0;
        }
    }
}
?>