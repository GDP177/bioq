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
    // Array para almacenar las estadísticas
    $estadisticas = array();
    
    // Total de órdenes
    $sql_ordenes = "SELECT COUNT(*) as total FROM orden";
    $query_ordenes = $conn->prepare($sql_ordenes);
    $query_ordenes->execute();
    $estadisticas['total_ordenes'] = $query_ordenes->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Total de pacientes
    $sql_pacientes = "SELECT COUNT(*) as total FROM paciente WHERE estado = 'activo'";
    $query_pacientes = $conn->prepare($sql_pacientes);
    $query_pacientes->execute();
    $estadisticas['total_pacientes'] = $query_pacientes->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Total de análisis disponibles
    $sql_analisis = "SELECT COUNT(*) as total FROM analisis WHERE INICIO_DE_VIGENCIA IS NOT NULL";
    $query_analisis = $conn->prepare($sql_analisis);
    $query_analisis->execute();
    $estadisticas['total_analisis'] = $query_analisis->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Órdenes pendientes
    $sql_pendientes = "SELECT COUNT(DISTINCT o.id_orden) as total 
                      FROM orden o
                      INNER JOIN orden_has_analisis oa ON o.id_orden = oa.id_orden
                      WHERE oa.fecha_realizacion_analisis IS NULL";
    $query_pendientes = $conn->prepare($sql_pendientes);
    $query_pendientes->execute();
    $estadisticas['ordenes_pendientes'] = $query_pendientes->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Devolver como JSON
    echo json_encode($estadisticas);
    
} catch(PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>