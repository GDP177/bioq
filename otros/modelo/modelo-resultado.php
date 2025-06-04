<?php
require_once 'conexion.php';

class Modelo_Resultado extends conexionBD {
    
    /**
     * Registra la cabecera del resultado de exámenes
     * @param int $realizar_examen_id ID del examen realizado
     * @param int $usuario_id ID del usuario que registra el resultado
     * @return int ID generado o 0 en caso de error
     */
    public function registrarResultado($realizar_examen_id, $usuario_id) {
        $c = conexionBD::conexionPDO();
        $sql = "CALL SP_registrar_resultado(?,?)";
        $query = $c->prepare($sql);
        $query->bindParam(1, $realizar_examen_id);
        $query->bindParam(2, $usuario_id);
        $query->execute();
        $resultado = $query->fetchColumn();
        
        return $resultado;
    }
    
    /**
     * Registra el detalle del resultado con su archivo
     * @param int $resultado_id ID de la cabecera del resultado
     * @param int $realizar_examen_detalle_id ID del detalle del examen realizado
     * @param string $archivo Ruta del archivo
     * @return int 1 si fue exitoso, 0 en caso de error
     */
    public function registrarResultadoDetalle($resultado_id, $realizar_examen_detalle_id, $archivo) {
        $c = conexionBD::conexionPDO();
        $sql = "CALL SP_registrar_resultado_detalle(?,?,?)";
        $query = $c->prepare($sql);
        $query->bindParam(1, $resultado_id);
        $query->bindParam(2, $realizar_examen_detalle_id);
        $query->bindParam(3, $archivo);
        $resultado = $query->execute();
        
        if($resultado) {
            return 1;
        } else {
            return 0;
        }
    }

    /**
     * Lista los resultados registrados
     * @return array Listado de resultados
     */
    public function listarResultados() {
        $c = conexionBD::conexionPDO();
        $sql = "CALL SP_listar_resultados()";
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
     * Lista los exámenes pendientes de resultado
     * @return array Listado de exámenes pendientes
     */
    public function listarExamenesPendientes() {
        $c = conexionBD::conexionPDO();
        $sql = "CALL SP_listar_examenes_pendientes()";
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
     * Obtiene los detalles de un examen por ID
     * @param int $realizar_examen_id ID del examen realizado
     * @return array Detalles del examen
     */
    public function obtenerDetalleExamen($realizar_examen_id) {
        $c = conexionBD::conexionPDO();
        $sql = "CALL SP_obtener_detalle_examen(?)";
        $arreglo = array();
        $query = $c->prepare($sql);
        $query->bindParam(1, $realizar_examen_id);
        $query->execute();
        $resultado = $query->fetchAll(PDO::FETCH_ASSOC);
        
        foreach($resultado as $respuesta) {
            $arreglo[] = $respuesta;
        }
        
        return $arreglo;
    }
}
?>
