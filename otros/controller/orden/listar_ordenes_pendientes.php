<?php
require '../../modelo/conexion.php';

// Verificar sesión
session_start();
if (!isset($_SESSION['S_USUARIO'])) {
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

// Crear conexión
$conexion = new conexionBD();
$conn = $conexion->conexionPDO();

try {
    // Órdenes con análisis pendientes
    $sql = "SELECT 
                o.id_orden, 
                CONCAT(p.Apellido_paciente, ' ', p.Nombre_paciente) as paciente,
                p.DNI,
                CONCAT(m.Apellido_medico, ' ', m.Nombre_medico) as medico_solicitante,
                DATE_FORMAT(o.fecha_ingreso_orden, '%d/%m/%Y') as fecha_ingreso,
                o.urgente,
                (SELECT COUNT(*) FROM orden_has_analisis oa WHERE oa.id_orden = o.id_orden AND oa.fecha_realizacion_analisis IS NULL) as analisis_pendientes
            FROM orden o
            INNER JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
            INNER JOIN medico m ON o.id_medico_solicitante = m.idMedico
            WHERE EXISTS (
                SELECT 1 FROM orden_has_analisis oa 
                WHERE oa.id_orden = o.id_orden 
                AND oa.fecha_realizacion_analisis IS NULL
            )
            ORDER BY o.urgente DESC, o.fecha_ingreso_orden ASC";
    
    $query = $conn->prepare($sql);
    $query->execute();
    $ordenes = $query->fetchAll(PDO::FETCH_ASSOC);
    
    // Devolver como JSON
    echo json_encode($ordenes);
    
} catch(PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>