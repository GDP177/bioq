
    /**
     * Obtiene todos los datos de un resultado específico
     * @param int $resultado_id ID del resultado
     * @return array Datos del resultado
     */
    public function obtenerResultado($resultado_id) {
        $c = conexionBD::conexionPDO();
        $sql = "SELECT 
                    r.resultado_id,
                    r.paciente_id,
                    CONCAT(p.paciente_apellido_paterno, ' ', p.paciente_apellido_materno, ' ', p.paciente_nombres) as paciente,
                    p.paciente_dni,
                    CONCAT(m.medico_apellido_paterno, ' ', m.medico_apellido_materno, ' ', m.medico_nombre) as medico,
                    DATE_FORMAT(re.realizar_examen_fecha, '%d/%m/%Y') as fecha_registro,
                    u.usu_nombre as usuario
                FROM resultado r
                INNER JOIN realizar_examen re ON r.realizar_examen_id = re.realizar_examen_id
                INNER JOIN paciente p ON re.paciente_id = p.paciente_id
                INNER JOIN medico m ON re.medico_id = m.medico_id
                INNER JOIN usuario u ON r.usuario_id = u.usu_id
                WHERE r.resultado_id = ?";
        $query = $c->prepare($sql);
        $query->bindParam(1, $resultado_id);
        $query->execute();
        $resultado = $query->fetch(PDO::FETCH_ASSOC);
        
        return $resultado;
    }
    
    /**
     * Obtiene los detalles de un resultado específico
     * @param int $resultado_id ID del resultado
     * @return array Detalles del resultado
     */
    public function obtenerDetalleResultado($resultado_id) {
        $c = conexionBD::conexionPDO();
        $sql = "SELECT 
                    rd.resultado_detalle_id,
                    rd.realizar_examen_detalle_id,
                    e.examen_nombre,
                    a.analisis_nombre,
                    rd.archivo
                FROM resultado_detalle rd
                INNER JOIN realizar_examen_detalle red ON rd.realizar_examen_detalle_id = red.realizar_examen_detalle_id
                INNER JOIN examen e ON red.examen_id = e.examen_id
                INNER JOIN analisis a ON e.analisis_id = a.analisis_id
                WHERE rd.resultado_id = ?";
        $query = $c->prepare($sql);
        $query->bindParam(1, $resultado_id);
        $query->execute();
        $resultado = $query->fetchAll(PDO::FETCH_ASSOC);
        
        return $resultado;
    }
}
?>
