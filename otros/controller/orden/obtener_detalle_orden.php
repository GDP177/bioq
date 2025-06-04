<?php
require '../../modelo/conexion.php';

// Verificar sesión
session_start();
if (!isset($_SESSION['S_USUARIO'])) {
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

// Verificar parámetro
if (!isset($_POST['id_orden'])) {
    echo json_encode(['error' => 'ID de orden no proporcionado']);
    exit;
}

$id_orden = (int)$_POST['id_orden'];

// Crear conexión
$conexion = new conexionBD();
$conn = $conexion->conexionPDO();

try {
    // Obtener datos de la orden
    $sql_orden = "SELECT 
                    o.id_orden, 
                    CONCAT(p.Apellido_paciente, ' ', p.Nombre_paciente) as paciente,
                    p.DNI,
                    CONCAT(m.Apellido_medico, ' ', m.Nombre_medico) as medico_solicitante,
                    DATE_FORMAT(o.fecha_ingreso_orden, '%d/%m/%Y') as fecha_ingreso,
                    o.urgente
                FROM orden o
                INNER JOIN paciente p ON o.nro_ficha_paciente = p.nro_ficha
                INNER JOIN medico m ON o.id_medico_solicitante = m.idMedico
                WHERE o.id_orden = ?";
    
    $query_orden = $conn->prepare($sql_orden);
    $query_orden->bindParam(1, $id_orden);
    $query_orden->execute();
    $orden = $query_orden->fetch(PDO::FETCH_ASSOC);
    
    if (!$orden) {
        echo json_encode(['error' => 'Orden no encontrada']);
        exit;
    }
    
    // Obtener análisis pendientes
    $sql_analisis = "SELECT 
                        oa.Codigo_de_practica as codigo_practica,
                        a.DESCRIPCION_DE_PRACTICA as descripcion_practica,
                        a.DESCRIPCION_DE_MODULO as descripcion_modulo
                    FROM orden_has_analisis oa
                    INNER JOIN analisis a ON oa.Codigo_de_practica = a.CODIGO_DE_PRACTICA
                    WHERE oa.id_orden = ? AND oa.fecha_realizacion_analisis IS NULL
                    ORDER BY a.DESCRIPCION_DE_PRACTICA";
    
    $query_analisis = $conn->prepare($sql_analisis);
    $query_analisis->bindParam(1, $id_orden);
    $query_analisis->execute();
    $analisis_pendientes = $query_analisis->fetchAll(PDO::FETCH_ASSOC);
    
    // Preparar respuesta
    $respuesta = [
        'orden' => $orden,
        'analisis_pendientes' => $analisis_pendientes
    ];
    
    // Devolver como JSON
    echo json_encode($respuesta);
    
} catch(PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>