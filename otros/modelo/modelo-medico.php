<?php
require_once 'conexion.php';

class Modelo_Medico extends conexionBD {

    /**
     * Lista los médicos para la tabla
     * @return array Datos de médicos
     */
    public function listarMedico() {
        $c = conexionBD::conexionPDO();
        $sql = "SELECT 
                idMedico, 
                Nombre_medico, 
                Apellido_medico, 
                DNI_medico,
                CASE WHEN idMedico > 0 THEN 'activo' ELSE 'inactivo' END as medico_estatus
                FROM medico 
                ORDER BY Apellido_medico, Nombre_medico";
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
     * Registra un nuevo médico
     * @param string $nombre Nombre del médico
     * @param string $apellido Apellido del médico
     * @param int $dni DNI del médico
     * @return int ID del médico o 0 si falló, -1 si ya existe un médico con ese DNI
     */
    public function registrarMedico($nombre, $apellido, $dni) {
        try {
            $c = conexionBD::conexionPDO();
            
            // Verificar si ya existe un médico con el mismo DNI
            $sql_verificar = "SELECT COUNT(*) FROM medico WHERE DNI_medico = ?";
            $query_verificar = $c->prepare($sql_verificar);
            $query_verificar->bindParam(1, $dni);
            $query_verificar->execute();
            $existe = $query_verificar->fetchColumn();
            
            if ($existe > 0) {
                return -1; // Médico con este DNI ya existe
            }
            
            // Obtener el siguiente ID
            $sql_id = "SELECT MAX(idMedico) + 1 FROM medico";
            $query_id = $c->prepare($sql_id);
            $query_id->execute();
            $nuevo_id = $query_id->fetchColumn();
            
            if (!$nuevo_id) {
                $nuevo_id = 1; // Si no hay médicos, empezar desde 1
            }
            
            $sql = "INSERT INTO medico (idMedico, Nombre_medico, Apellido_medico, DNI_medico) 
                    VALUES (?, ?, ?, ?)";
            $query = $c->prepare($sql);
            $query->bindParam(1, $nuevo_id);
            $query->bindParam(2, $nombre);
            $query->bindParam(3, $apellido);
            $query->bindParam(4, $dni);
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
     * Modifica los datos de un médico
     * @param int $id ID del médico
     * @param string $nombre Nombre del médico
     * @param string $apellido Apellido del médico
     * @param int $dni DNI del médico
     * @return int 1 si fue exitoso, 0 si falló, -1 si ya existe otro médico con ese DNI
     */
    public function modificarMedico($id, $nombre, $apellido, $dni) {
        try {
            $c = conexionBD::conexionPDO();
            
            // Verificar si ya existe otro médico con el mismo DNI
            $sql_verificar = "SELECT COUNT(*) FROM medico WHERE DNI_medico = ? AND idMedico != ?";
            $query_verificar = $c->prepare($sql_verificar);
            $query_verificar->bindParam(1, $dni);
            $query_verificar->bindParam(2, $id);
            $query_verificar->execute();
            $existe = $query_verificar->fetchColumn();
            
            if ($existe > 0) {
                return -1; // Ya existe otro médico con ese DNI
            }
            
            $sql = "UPDATE medico SET 
                    Nombre_medico = ?, 
                    Apellido_medico = ?, 
                    DNI_medico = ?
                    WHERE idMedico = ?";
            $query = $c->prepare($sql);
            $query->bindParam(1, $nombre);
            $query->bindParam(2, $apellido);
            $query->bindParam(3, $dni);
            $query->bindParam(4, $id);
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
     * Lista médicos activos para los selects
     * @return array Lista de médicos
     */
    public function listarSelectMedico() {
        $c = conexionBD::conexionPDO();
        $sql = "SELECT 
                    m.idMedico,
                    CONCAT(m.Apellido_medico, ' ', m.Nombre_medico) as medico
                FROM medico m
                ORDER BY m.Apellido_medico, m.Nombre_medico";
        $query = $c->prepare($sql);
        $query->execute();
        $resultado = $query->fetchAll(PDO::FETCH_BOTH);
        
        return $resultado;
    }
}
?>