<?php
require '../../modelo/modelo-usuario.php';

// Verificar si se recibieron datos de inicio de sesión
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Obtener datos
    $usuario = isset($_POST['usuario']) ? $_POST['usuario'] : '';
    $clave = isset($_POST['clave']) ? $_POST['clave'] : '';
    
    // Validar que no estén vacíos
    if (empty($usuario) || empty($clave)) {
        echo json_encode(['status' => 'error', 'message' => 'El usuario y la contraseña son requeridos']);
        exit;
    }
    
    // Instanciar modelo
    $MU = new Modelo_Usuario();
    
    // Verificar credenciales
    $resultado = $MU->verificarUsuario($usuario, $clave);
    
    if ($resultado) {
        // Si el usuario está inactivo
        if ($resultado['usu_estatus'] !== 'activo') {
            echo json_encode(['status' => 'error', 'message' => 'El usuario está desactivado']);
            exit;
        }
        
        // Iniciar sesión
        session_start();
        
        // Guardar datos en la sesión
        $_SESSION['S_ID_USUARIO'] = $resultado['usu_id'];
        $_SESSION['S_USUARIO'] = $resultado['usu_nombre'];
        $_SESSION['S_ROL'] = $resultado['usu_rol'];
        
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Usuario o contraseña incorrectos']);
    }
    exit;
}

// Si no es una solicitud POST, redireccionar a la página de inicio
header('Location: ../../index.php');
exit;
?>