<?php
require '../../modelo/conexion.php';

// Verificar sesión
session_start();
if (!isset($_SESSION['S_USUARIO'])) {
    echo json_encode(['status' => 'error', 'message' => 'No autorizado']);
    exit;
}

// Verificar parámetros
if (!isset($_POST['id_orden']) || !isset($_POST['codigo_practica'])) {
    echo json_encode(['status' => 'error', 'message' => 'Parámetros incompletos']);
    exit;
}

$id_orden = (int)$_POST['id_orden'];
$codigo_practica = (int)$_POST['codigo_practica'];

// Crear conexión
$conexion = new conexionBD();
$conn = $conexion->conexionPDO();

try {
    // Obtener la fecha actual
    $fecha_actual = date('Y-m-d');
    
    // Actualizar el registro
    $sql = "UPDATE orden_has_analisis 
            SET fecha_realizacion_analisis = ? 
            WHERE id_orden = ? AND Codigo_de_practica = ?";
    
    $query = $conn->prepare($sql);
    $query->bindParam(1, $fecha_actual);
    $query->bindParam(2, $id_orden);
    $query->bindParam(3, $codigo_practica);
    $resultado = $query->execute();
    
    if ($resultado) {
        echo json_encode(['status' => 'success', 'message' => 'Análisis marcado como realizado correctamente']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Error al actualizar el registro']);
    }
    
} catch(PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>