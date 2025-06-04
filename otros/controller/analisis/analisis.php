<?php
require '../../modelo/modelo-analisis.php';

/**
 * Controlador para listar análisis
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'listar') {
    // Instanciar modelo
    $MA = new Modelo_Analisis();
    
    // Listar análisis
    $resultado = $MA->listarAnalisis();
    
    // Devolver JSON
    echo json_encode($resultado);
    exit;
}

/**
 * Controlador para registrar un nuevo análisis
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'registrar') {
    // Obtener datos del formulario
    $descripcion = htmlspecialchars(trim($_POST['descripcion']), ENT_QUOTES, 'UTF-8');
    $codigo_modulo = isset($_POST['codigo_modulo']) ? (int)$_POST['codigo_modulo'] : 0;
    $descripcion_modulo = htmlspecialchars(trim($_POST['descripcion_modulo']), ENT_QUOTES, 'UTF-8');
    $tipo = htmlspecialchars(trim($_POST['tipo']), ENT_QUOTES, 'UTF-8');
    $inicio_vigencia = htmlspecialchars(trim($_POST['inicio_vigencia']), ENT_QUOTES, 'UTF-8');
    $honorarios = isset($_POST['honorarios']) ? (float)$_POST['honorarios'] : 0;
    $gastos = isset($_POST['gastos']) ? (float)$_POST['gastos'] : 0;
    
    // Instanciar modelo
    $MA = new Modelo_Analisis();
    
    // Registrar análisis
    $resultado = $MA->registrarAnalisis($descripcion, $codigo_modulo, $descripcion_modulo, $tipo, $inicio_vigencia, $honorarios, $gastos);
    
    // Devolver resultado
    if ($resultado === 2) {
        echo json_encode(['status' => 'error', 'message' => 'Ya existe un análisis con esta descripción']);
    } elseif ($resultado > 0) {
        echo json_encode(['status' => 'success', 'message' => 'Análisis registrado correctamente', 'id' => $resultado]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Error al registrar el análisis']);
    }
    exit;
}

/**
 * Controlador para modificar un análisis
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'modificar') {
    // Obtener datos del formulario
    $id = (int)$_POST['id'];
    $descripcion = htmlspecialchars(trim($_POST['descripcion']), ENT_QUOTES, 'UTF-8');
    $codigo_modulo = isset($_POST['codigo_modulo']) ? (int)$_POST['codigo_modulo'] : 0;
    $descripcion_modulo = htmlspecialchars(trim($_POST['descripcion_modulo']), ENT_QUOTES, 'UTF-8');
    $tipo = htmlspecialchars(trim($_POST['tipo']), ENT_QUOTES, 'UTF-8');
    $inicio_vigencia = htmlspecialchars(trim($_POST['inicio_vigencia']), ENT_QUOTES, 'UTF-8');
    $honorarios = isset($_POST['honorarios']) ? (float)$_POST['honorarios'] : 0;
    $gastos = isset($_POST['gastos']) ? (float)$_POST['gastos'] : 0;
    
    // Si inicio_vigencia está vacío, establecer como NULL para inactivo
    if (empty($inicio_vigencia)) {
        $inicio_vigencia = null;
    }
    
    // Instanciar modelo
    $MA = new Modelo_Analisis();
    
    // Modificar análisis
    $resultado = $MA->modificarAnalisis($id, $descripcion, $codigo_modulo, $descripcion_modulo, $tipo, $inicio_vigencia, $honorarios, $gastos);
    
    // Devolver resultado
    if ($resultado === 2) {
        echo json_encode(['status' => 'error', 'message' => 'Ya existe otro análisis con esta descripción']);
    } elseif ($resultado === 1) {
        echo json_encode(['status' => 'success', 'message' => 'Análisis modificado correctamente']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Error al modificar el análisis']);
    }
    exit;
}

/**
 * Controlador para cargar análisis para un select
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'select') {
    // Instanciar modelo
    $MA = new Modelo_Analisis();
    
    // Cargar análisis para select
    $resultado = $MA->listarSelectAnalisis();
    
    // Devolver JSON
    echo json_encode($resultado);
    exit;
}

/**
 * Controlador para obtener análisis incluidos
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'incluidos') {
    // Obtener código del análisis padre
    $codigo_padre = (int)$_POST['codigo_padre'];
    
    // Instanciar modelo
    $MA = new Modelo_Analisis();
    
    // Obtener análisis incluidos
    $resultado = $MA->obtenerAnalisisIncluidos($codigo_padre);
    
    // Devolver JSON
    echo json_encode($resultado);
    exit;
}

/**
 * Controlador para agregar análisis incluido
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'agregar_incluido') {
    // Obtener datos
    $codigo_padre = (int)$_POST['codigo_padre'];
    $codigo_hijo = (int)$_POST['codigo_hijo'];
    $descripcion = htmlspecialchars(trim($_POST['descripcion']), ENT_QUOTES, 'UTF-8');
    
    // Instanciar modelo
    $MA = new Modelo_Analisis();
    
    // Agregar análisis incluido
    $resultado = $MA->agregarAnalisisIncluido($codigo_padre, $codigo_hijo, $descripcion);
    
    // Devolver resultado
    if ($resultado) {
        echo json_encode(['status' => 'success', 'message' => 'Análisis incluido correctamente']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Error al incluir el análisis o ya está incluido']);
    }
    exit;
}

/**
 * Controlador para eliminar análisis incluido
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'eliminar_incluido') {
    // Obtener datos
    $codigo_padre = (int)$_POST['codigo_padre'];
    $codigo_hijo = (int)$_POST['codigo_hijo'];
    
    // Instanciar modelo
    $MA = new Modelo_Analisis();
    
    // Eliminar análisis incluido
    $resultado = $MA->eliminarAnalisisIncluido($codigo_padre, $codigo_hijo);
    
    // Devolver resultado
    if ($resultado) {
        echo json_encode(['status' => 'success', 'message' => 'Análisis eliminado correctamente']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Error al eliminar el análisis incluido']);
    }
    exit;
}

// Si no se ha ejecutado ninguna acción válida
echo json_encode(['status' => 'error', 'message' => 'Acción no válida']);
exit;
?>