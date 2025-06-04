<?php
require_once 'conexion.php';

class Modelo_Analisis extends conexionBD {
    
    /**
     * Lista los análisis para el datatable
     * @return array Arreglo con datos de análisis
     */
    public function listarAnalisis() {
        $c = conexionBD::conexionPDO();
        $sql = "SELECT 
                CODIGO_DE_PRACTICA as analisis_id, 
                DESCRIPCION_DE_PRACTICA as analisis_nombre,
                CODIGO_DE_MODULO,
                DESCRIPCION_DE_MODULO,
                TIPO,
                INICIO_DE_VIGENCIA,
                HONORARIOS,
                GASTOS,
                CASE WHEN INICIO_DE_VIGENCIA IS NOT NULL THEN 'activo' ELSE 'inactivo' END as analisis_estatus
                FROM analisis
                ORDER BY DESCRIPCION_DE_PRACTICA";
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
     * Registra un nuevo análisis
     * @param string $descripcion Descripción de la práctica
     * @param int $codigo_modulo Código de módulo
     * @param string $descripcion_modulo Descripción del módulo
     * @param string $tipo Tipo de análisis
     * @param string $inicio_vigencia Fecha de inicio de vigencia
     * @param float $honorarios Honorarios
     * @param float $gastos Gastos
     * @return int ID del análisis creado o 0 si falló, 2 si ya existe
     */
    public function registrarAnalisis($descripcion, $codigo_modulo, $descripcion_modulo, $tipo, $inicio_vigencia, $honorarios, $gastos) {
        try {
            $c = conexionBD::conexionPDO();
            
            // Verificar si ya existe un análisis con la misma descripción
            $sql_verificar = "SELECT COUNT(*) FROM analisis WHERE DESCRIPCION_DE_PRACTICA = ?";
            $query_verificar = $c->prepare($sql_verificar);
            $query_verificar->bindParam(1, $descripcion);
            $query_verificar->execute();
            $existe = $query_verificar->fetchColumn();
            
            if ($existe > 0) {
                return 2; // Ya existe
            }
            
            // Obtener el próximo ID disponible
            $sql_id = "SELECT MAX(CODIGO_DE_PRACTICA) + 1 FROM analisis";
            $query_id = $c->prepare($sql_id);
            $query_id->execute();
            $nuevo_id = $query_id->fetchColumn();
            
            if (!$nuevo_id) {
                $nuevo_id = 1; // Si no hay registros, empezar desde 1
            }
            
            // Insertar el nuevo análisis
            $sql = "INSERT INTO analisis (CODIGO_DE_PRACTICA, DESCRIPCION_DE_PRACTICA, CODIGO_DE_MODULO, 
                    DESCRIPCION_DE_MODULO, TIPO, INICIO_DE_VIGENCIA, HONORARIOS, GASTOS) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            $query = $c->prepare($sql);
            $query->bindParam(1, $nuevo_id);
            $query->bindParam(2, $descripcion);
            $query->bindParam(3, $codigo_modulo);
            $query->bindParam(4, $descripcion_modulo);
            $query->bindParam(5, $tipo);
            $query->bindParam(6, $inicio_vigencia);
            $query->bindParam(7, $honorarios);
            $query->bindParam(8, $gastos);
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
     * Modifica un análisis existente
     * @param int $id ID del análisis
     * @param string $descripcion Descripción de la práctica
     * @param int $codigo_modulo Código de módulo
     * @param string $descripcion_modulo Descripción del módulo
     * @param string $tipo Tipo de análisis
     * @param string $inicio_vigencia Fecha de inicio de vigencia (NULL = inactivo)
     * @param float $honorarios Honorarios
     * @param float $gastos Gastos
     * @return int 1 si fue exitoso, 0 si falló, 2 si ya existe otro con esa descripción
     */
    public function modificarAnalisis($id, $descripcion, $codigo_modulo, $descripcion_modulo, $tipo, $inicio_vigencia, $honorarios, $gastos) {
        try {
            $c = conexionBD::conexionPDO();
            
            // Verificar si ya existe otro análisis con la misma descripción
            $sql_verificar = "SELECT COUNT(*) FROM analisis WHERE DESCRIPCION_DE_PRACTICA = ? AND CODIGO_DE_PRACTICA != ?";
            $query_verificar = $c->prepare($sql_verificar);
            $query_verificar->bindParam(1, $descripcion);
            $query_verificar->bindParam(2, $id);
            $query_verificar->execute();
            $existe = $query_verificar->fetchColumn();
            
            if ($existe > 0) {
                return 2; // Ya existe otro con esa descripción
            }
            
            $sql = "UPDATE analisis SET 
                    DESCRIPCION_DE_PRACTICA = ?, 
                    CODIGO_DE_MODULO = ?, 
                    DESCRIPCION_DE_MODULO = ?, 
                    TIPO = ?,
                    INICIO_DE_VIGENCIA = ?,
                    HONORARIOS = ?,
                    GASTOS = ?
                    WHERE CODIGO_DE_PRACTICA = ?";
            $query = $c->prepare($sql);
            $query->bindParam(1, $descripcion);
            $query->bindParam(2, $codigo_modulo);
            $query->bindParam(3, $descripcion_modulo);
            $query->bindParam(4, $tipo);
            $query->bindParam(5, $inicio_vigencia);
            $query->bindParam(6, $honorarios);
            $query->bindParam(7, $gastos);
            $query->bindParam(8, $id);
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
     * Lista análisis activos para los selects
     * @return array Lista de análisis
     */
    public function listarSelectAnalisis() {
        $c = conexionBD::conexionPDO();
        $sql = "SELECT CODIGO_DE_PRACTICA, DESCRIPCION_DE_PRACTICA 
                FROM analisis 
                WHERE INICIO_DE_VIGENCIA IS NOT NULL 
                ORDER BY DESCRIPCION_DE_PRACTICA";
        $query = $c->prepare($sql);
        $query->execute();
        $resultado = $query->fetchAll(PDO::FETCH_BOTH);
        
        return $resultado;
    }
    
    /**
     * Obtiene las relaciones jerárquicas de un análisis
     * @param int $codigo_padre Código del análisis padre
     * @return array Lista de análisis hijos
     */
    public function obtenerAnalisisIncluidos($codigo_padre) {
        $c = conexionBD::conexionPDO();
        $sql = "SELECT i.cod_hijo, a.DESCRIPCION_DE_PRACTICA, i.descripcion
                FROM incluye i
                INNER JOIN analisis a ON i.cod_hijo = a.CODIGO_DE_PRACTICA
                WHERE i.cod_padre = ?";
        $query = $c->prepare($sql);
        $query->bindParam(1, $codigo_padre);
        $query->execute();
        $resultado = $query->fetchAll(PDO::FETCH_ASSOC);
        
        return $resultado;
    }
    
    /**
     * Agrega una relación jerárquica entre análisis
     * @param int $codigo_padre Código del análisis padre
     * @param int $codigo_hijo Código del análisis hijo
     * @param string $descripcion Descripción de la relación
     * @return boolean Verdadero si fue exitoso, falso si falló
     */
    public function agregarAnalisisIncluido($codigo_padre, $codigo_hijo, $descripcion) {
        try {
            $c = conexionBD::conexionPDO();
            
            // Verificar que no exista la relación
            $sql_verificar = "SELECT COUNT(*) FROM incluye WHERE cod_padre = ? AND cod_hijo = ?";
            $query_verificar = $c->prepare($sql_verificar);
            $query_verificar->bindParam(1, $codigo_padre);
            $query_verificar->bindParam(2, $codigo_hijo);
            $query_verificar->execute();
            $existe = $query_verificar->fetchColumn();
            
            if ($existe > 0) {
                return false; // Ya existe esta relación
            }
            
            $sql = "INSERT INTO incluye (cod_padre, cod_hijo, descripcion) VALUES (?, ?, ?)";
            $query = $c->prepare($sql);
            $query->bindParam(1, $codigo_padre);
            $query->bindParam(2, $codigo_hijo);
            $query->bindParam(3, $descripcion);
            $resultado = $query->execute();
            
            return $resultado;
        } catch (Exception $e) {
            return false;
        }
    }
    
    /**
     * Elimina una relación jerárquica entre análisis
     * @param int $codigo_padre Código del análisis padre
     * @param int $codigo_hijo Código del análisis hijo
     * @return boolean Verdadero si fue exitoso, falso si falló
     */
    public function eliminarAnalisisIncluido($codigo_padre, $codigo_hijo) {
        try {
            $c = conexionBD::conexionPDO();
            $sql = "DELETE FROM incluye WHERE cod_padre = ? AND cod_hijo = ?";
            $query = $c->prepare($sql);
            $query->bindParam(1, $codigo_padre);
            $query->bindParam(2, $codigo_hijo);
            $resultado = $query->execute();
            
            return $resultado;
        } catch (Exception $e) {
            return false;
        }
    }
}
?>