<?php
require '../../modelo/modelo-orden-nuevo.php';

/**
 * Controlador para listar órdenes
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'listar') {
    // Instanciar modelo
    $MO = new Modelo_Orden();
    
    // Listar órdenes
    $resultado = $MO->listarOrdenes();
    
    // Devolver JSON
    echo json_encode($resultado);
    exit;
}

/**
 * Controlador para registrar una nueva orden
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'registrar') {
    // Obtener datos del formulario
    $urgente = isset($_POST['urgente']) ? 1 : 0;
    $id_medico = (int)$_POST['id_medico'];
    $id_bioquimico = !empty($_POST['id_bioquimico']) ? (int)$_POST['id_bioquimico'] : null;
    $nro_ficha = (int)$_POST['nro_ficha'];
    
    // Instanciar modelo
    $MO = new Modelo_Orden();
    
    // Registrar orden
    $resultado = $MO->registrarOrden($urgente, $id_medico, $id_bioquimico, $nro_ficha);
    
    // Devolver resultado
    if ($resultado > 0) {
        echo json_encode(['status' => 'success', 'message' => 'Orden registrada correctamente', 'id_orden' => $resultado]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Error al registrar la orden']);
    }
    exit;
}

/**
 * Controlador para agregar análisis a una orden
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'agregar_analisis') {
    // Obtener datos
    $id_orden = (int)$_POST['id_orden'];
    $codigo_practica = (int)$_POST['codigo_practica'];
    
    // Instanciar modelo
    $MO = new Modelo_Orden();
    
    // Agregar análisis a la orden
    $resultado = $MO->agregarAnalisisOrden($id_orden, $codigo_practica);
    
    // Devolver resultado
    if ($resultado === 1) {
        echo json_encode(['status' => 'success', 'message' => 'Análisis agregado a la orden correctamente']);
    } elseif ($resultado === -1) {
        echo json_encode(['status' => 'error', 'message' => 'Este análisis ya está asignado a la orden']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Error al agregar el análisis a la orden']);
    }
    exit;
}

/**
 * Controlador para eliminar análisis de una orden
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'eliminar_analisis') {
    // Obtener datos
    $id_orden = (int)$_POST['id_orden'];
    $codigo_practica = (int)$_POST['codigo_practica'];
    
    // Instanciar modelo
    $MO = new Modelo_Orden();
    
    // Eliminar análisis de la orden
    $resultado = $MO->eliminarAnalisisOrden($id_orden, $codigo_practica);
    
    // Devolver resultado
    if ($resultado === 1) {
        echo json_encode(['status' => 'success', 'message' => 'Análisis eliminado de la orden correctamente']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Error al eliminar el análisis de la orden']);
    }
    exit;
}

/**
 * Controlador para obtener análisis de una orden
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'obtener_analisis') {
    // Obtener ID de la orden
    $id_orden = (int)$_POST['id_orden'];
    
    // Instanciar modelo
    $MO = new Modelo_Orden();
    
    // Obtener análisis de la orden
    $resultado = $MO->obtenerAnalisisOrden($id_orden);
    
    // Devolver JSON
    echo json_encode($resultado);
    exit;
}

/**
 * Controlador para marcar un análisis como realizado
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'marcar_realizado') {
    // Obtener datos
    $id_orden = (int)$_POST['id_orden'];
    $codigo_practica = (int)$_POST['codigo_practica'];
    
    // Instanciar modelo
    $MO = new Modelo_Orden();
    
    // Marcar análisis como realizado
    $resultado = $MO->marcarAnalisisRealizado($id_orden, $codigo_practica);
    
    // Devolver resultado
    if ($resultado === 1) {
        echo json_encode(['status' => 'success', 'message' => 'Análisis marcado como realizado correctamente']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Error al marcar el análisis como realizado']);
    }
    exit;
}

/**
 * Controlador para obtener una orden completa
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'obtener_orden') {
    // Obtener ID de la orden
    $id_orden = (int)$_POST['id_orden'];
    
    // Instanciar modelo
    $MO = new Modelo_Orden();
    
    // Obtener datos de la orden
    $orden = $MO->obtenerOrden($id_orden);
    
    // Si la orden existe, obtener sus análisis
    if ($orden) {
        $analisis = $MO->obtenerAnalisisOrden($id_orden);
        $orden['analisis'] = $analisis;
    }
    
    // Devolver JSON
    echo json_encode($orden);
    exit;
}

/**
 * Controlador para listar órdenes pendientes
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'pendientes') {
    // Instanciar modelo
    $MO = new Modelo_Orden();
    
    // Listar órdenes pendientes
    $resultado = $MO->listarOrdenesPendientes();
    
    // Devolver JSON
    echo json_encode($resultado);
    exit;
}

/**
 * Controlador para registrar valor hallado
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'registrar_valor') {
    // Obtener datos
    $codigo_practica = (int)$_POST['codigo_practica'];
    $id_valor_ref = (int)$_POST['id_valor_ref'];
    $valor_hallado = (float)$_POST['valor_hallado'];
    $unidad_valor_hallado = htmlspecialchars(trim($_POST['unidad_valor_hallado']), ENT_QUOTES, 'UTF-8');
    
    // Instanciar modelo
    $MO = new Modelo_Orden();
    
    // Registrar valor hallado
    $resultado = $MO->registrarValorHallado($codigo_practica, $id_valor_ref, $valor_hallado, $unidad_valor_hallado);
    
    // Devolver resultado
    if ($resultado === 1) {
        echo json_encode(['status' => 'success', 'message' => 'Valor registrado correctamente']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Error al registrar el valor']);
    }
    exit;
}

// Si no se ha ejecutado ninguna acción válida
echo json_encode(['status' => 'error', 'message' => 'Acción no válida']);
exit;
?>