<?php
require '../../modelo/conexion.php';

// Verificar sesión
session_start();
if (!isset($_SESSION['S_USUARIO'])) {
    echo json_encode(['status' => 'error', 'message' => 'No autorizado']);
    exit;
}

// Verificar parámetros
if (!isset($_POST['id_orden']) || !isset($_POST['codigo_practica']) || !isset($_POST['valores'])) {
    echo json_encode(['status' => 'error', 'message' => 'Parámetros incompletos']);
    exit;
}

$id_orden = (int)$_POST['id_orden'];
$codigo_practica = (int)$_POST['codigo_practica'];
$valores_json = $_POST['valores'];
$observaciones = isset($_POST['observaciones']) ? $_POST['observaciones'] : '';

// Decodificar valores
$valores = json_decode($valores_json, true);

if (!is_array($valores) || empty($valores)) {
    echo json_encode(['status' => 'error', 'message' => 'No se proporcionaron valores válidos']);
    exit;
}

// Crear conexión
$conexion = new conexionBD();
$conn = $conexion->conexionPDO();

try {
    // Iniciar transacción
    $conn->beginTransaction();
    
    // 1. Marcar el análisis como realizado en orden_has_analisis
    $fecha_actual = date('Y-m-d');
    $sql_actualizar = "UPDATE orden_has_analisis 
                      SET fecha_realizacion_analisis = ? 
                      WHERE id_orden = ? AND Codigo_de_practica = ?";
    $query_actualizar = $conn->prepare($sql_actualizar);
    $query_actualizar->bindParam(1, $fecha_actual);
    $query_actualizar->bindParam(2, $id_orden);
    $query_actualizar->bindParam(3, $codigo_practica);
    $query_actualizar->execute();
    
    // 2. Guardar los valores hallados en la tabla 'tiene'
    foreach ($valores as $valor) {
        $id_valor_ref = (int)$valor['id_valor_ref'];
        $valor_hallado = (float)$valor['valor_hallado'];
        $unidad = $valor['unidad'];
        
        // Si es un valor genérico (id_valor_ref = 0), lo guardamos en otra tabla o en un campo de observaciones
        if ($id_valor_ref === 0) {
            // En este caso lo guardamos en las observaciones, pero podría implementarse de otra forma
            if (!empty($observaciones)) {
                $observaciones .= "\n";
            }
            $observaciones .= "Valor hallado: {$valor_hallado} {$unidad}";
            continue;
        }
        
        // Verificar si ya existe
        $sql_verificar = "SELECT COUNT(*) FROM tiene 
                         WHERE CODIGO_DE_PRACTICA = ? AND id_valor_ref = ?";
        $query_verificar = $conn->prepare($sql_verificar);
        $query_verificar->bindParam(1, $codigo_practica);
        $query_verificar->bindParam(2, $id_valor_ref);
        $query_verificar->execute();
        $existe = $query_verificar->fetchColumn();
        
        if ($existe) {
            // Actualizar
            $sql_guardar = "UPDATE tiene 
                           SET valor_hallado = ?, unidad_valor_hallado = ? 
                           WHERE CODIGO_DE_PRACTICA = ? AND id_valor_ref = ?";
        } else {
            // Insertar
            $sql_guardar = "INSERT INTO tiene 
                           (CODIGO_DE_PRACTICA, id_valor_ref, valor_hallado, unidad_valor_hallado) 
                           VALUES (?, ?, ?, ?)";
        }
        
        $query_guardar = $conn->prepare($sql_guardar);
        
        if ($existe) {
            $query_guardar->bindParam(1, $valor_hallado);
            $query_guardar->bindParam(2, $unidad);
            $query_guardar->bindParam(3, $codigo_practica);
            $query_guardar->bindParam(4, $id_valor_ref);
        } else {
            $query_guardar->bindParam(1, $codigo_practica);
            $query_guardar->bindParam(2, $id_valor_ref);
            $query_guardar->bindParam(3, $valor_hallado);
            $query_guardar->bindParam(4, $unidad);
        }
        
        $query_guardar->execute();
    }
    
    // 3. Almacenar observaciones (opcional, depende de tu estructura)
    // Aquí podrías guardar las observaciones en una tabla adicional si es necesario
    
    // Confirmar transacción
    $conn->commit();
    
    echo json_encode(['status' => 'success', 'message' => 'Resultados guardados correctamente']);
    
} catch(PDOException $e) {
    // Revertir cambios en caso de error
    $conn->rollBack();
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>