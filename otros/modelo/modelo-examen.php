<?php
require_once 'conexion.php';

class Modelo_Examen extends conexionBD {
    
    /**
     * Lista los exámenes para el datatable
     * @return array Arreglo con datos de exámenes
     */
    public function listarExamen() {
        $c = conexionBD::conexionPDO();
        $sql = "CALL SP_listar_examen()";
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
     * Registra un nuevo examen
     * @param string $examen Nombre del examen
     * @param int $analisis_id ID del análisis
     * @return int 1 si fue exitoso, 2 si ya existe, 0 si falló
     */
    public function registrarExamen($examen, $analisis_id) {
        $c = conexionBD::conexionPDO();
        $sql = "CALL SP_registrar_examen(?,?)";
        $query = $c->prepare($sql);
        $query->bindParam(1, $examen);
        $query->bindParam(2, $analisis_id);
        $query->execute();
        $resultado = $query->fetchColumn();
        
        return $resultado;
    }
    
    /**
     * Modifica un examen existente
     * @param int $id ID del examen
     * @param string $examen Nombre del examen
     * @param int $analisis_id ID del análisis
     * @param string $estatus Estatus (activo/inactivo)
     * @return int 1 si fue exitoso, 2 si ya existe, 0 si falló
     */
    public function modificarExamen($id, $examen, $analisis_id, $estatus) {
        $c = conexionBD::conexionPDO();
        $sql = "CALL SP_modificar_examen(?,?,?,?)";
        $query = $c->prepare($sql);
        $query->bindParam(1, $id);
        $query->bindParam(2, $examen);
        $query->bindParam(3, $analisis_id);
        $query->bindParam(4, $estatus);
        $query->execute();
        $resultado = $query->fetchColumn();
        
        return $resultado;
    }
    
    /**
     * Lista exámenes por análisis para los selects
     * @param int $analisis_id ID del análisis
     * @return array Arreglo de exámenes
     */
    public function listarExamenesPorAnalisis($analisis_id) {
        $c = conexionBD::conexionPDO();
        $sql = "SELECT examen_id, examen_nombre 
                FROM examen 
                WHERE analisis_id = ? AND examen_estatus = 'activo'
                ORDER BY examen_nombre";
        $query = $c->prepare($sql);
        $query->bindParam(1, $analisis_id);
        $query->execute();
        $resultado = $query->fetchAll(PDO::FETCH_BOTH);
        
        return $resultado;
    }
}
?>
