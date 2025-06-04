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
    // Órdenes urgentes pendientes
    $sql = "SELECT 
                o.id_orden, 
                CONCAT(p.Apellido_paciente, ' ', p.Nombre_paciente) as paciente,
                DATE_FORMAT(o.fecha_ingreso_orden, '%d/%m/%Y') as fecha_ingreso
            FROM orden o
            INNER JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
            WHERE o.urgente = 1
            AND EXISTS (
                SELECT 1 FROM orden_has_analisis oa 
                WHERE oa.id_orden = o.id_orden 
                AND oa.fecha_realizacion_analisis IS NULL
            )
            ORDER BY o.fecha_ingreso_orden ASC
            LIMIT 5";
    
    $query = $conn->prepare($sql);
    $query->execute();
    $ordenes = $query->fetchAll(PDO::FETCH_ASSOC);
    
    // Devolver como JSON
    echo json_encode($ordenes);
    
} catch(PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>