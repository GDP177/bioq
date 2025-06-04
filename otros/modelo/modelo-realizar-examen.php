<?php
require_once 'conexion.php';

class Modelo_Realizar_Examen extends conexionBD {
    
    /**
     * Listado de exámenes realizados para el datatable 
     * @return array Arreglo con datos de exámenes realizados
     */
    public function listarRealizarExamen() {
        $c = conexionBD::conexionPDO();
        $sql = "CALL SP_listar_realizar_examen()";
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
     * Registra la cabecera del examen realizado
     * @param int $paciente_id ID del paciente
     * @param int $usuario_id ID del usuario que registra
     * @param int $medico_id ID del médico que indica
     * @return int ID generado o 0 en caso de error
     */
    public function registrarRealizarExamen($paciente_id, $usuario_id, $medico_id) {
        $c = conexionBD::conexionPDO();
        $sql = "CALL SP_registrar_realizar_examen(?,?,?)";
        $query = $c->prepare($sql);
        $query->bindParam(1, $paciente_id);
        $query->bindParam(2, $usuario_id);
        $query->bindParam(3, $medico_id);
        $query->execute();
        $resultado = $query->fetchColumn();
        
        return $resultado;
    }
    
    /**
     * Registra el detalle de exámenes a realizar
     * @param int $realizar_examen_id ID de la cabecera
     * @param int $examen_id ID del examen
     * @param int $analisis_id ID del análisis
     * @return int 1 si fue exitoso, 0 en caso de error
     */
    public function registrarRealizarExamenDetalle($realizar_examen_id, $examen_id, $analisis_id) {
        $c = conexionBD::conexionPDO();
        $sql = "CALL SP_registrar_realizar_examen_detalle(?,?,?)";
        $query = $c->prepare($sql);
        $query->bindParam(1, $realizar_examen_id);
        $query->bindParam(2, $examen_id);
        $query->bindParam(3, $analisis_id);
        $resultado = $query->execute();
        
        if($resultado) {
            return 1;
        } else {
            return 0;
        }
    }

    /**
     * Lista pacientes para el autocomplete
     * @param string $valor Texto para buscar
     * @return array Pacientes coincidentes
     */
    public function buscarPacientes($valor) {
        $c = conexionBD::conexionPDO();
        $sql = "SELECT 
                    paciente_id, 
                    CONCAT(paciente_apellido_paterno, ' ', paciente_apellido_materno, ' ', paciente_nombres) as paciente,
                    paciente_dni 
                FROM paciente 
                WHERE paciente_estatus = 'activo' 
                AND (paciente_nombres LIKE :valor OR paciente_apellido_paterno LIKE :valor OR paciente_apellido_materno LIKE :valor OR paciente_dni LIKE :valor)";
        $query = $c->prepare($sql);
        $query->bindValue(':valor', '%'.$valor.'%');
        $query->execute();
        $resultado = $query->fetchAll(PDO::FETCH_ASSOC);
        
        return $resultado;
    }

    /**
     * Lista detalles de exámenes realizados por ID de análisis
     * @param int $analisis_id ID del análisis
     * @return array Detalles de exámenes
     */
    public function listarDetalleAnalisisResultado($analisis_id) {
        $c = conexionBD::conexionPDO();
        $sql = "CALL SP_listar_detalle_analisis_resultado(?)";
        $arreglo = array();
        $query = $c->prepare($sql);
        $query->bindParam(1, $analisis_id);
        $query->execute();
        $resultado = $query->fetchAll(PDO::FETCH_ASSOC);
        
        foreach($resultado as $respuesta) {
            $arreglo[] = $respuesta;
        }
        
        return $arreglo;
    }
}
?>
