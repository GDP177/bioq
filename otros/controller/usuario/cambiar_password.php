<?php
session_start();
require '../../modelo/modelo-usuario.php';

// Verificar sesión
if (!isset($_SESSION['S_ID_USUARIO'])) {
    echo json_encode(['status' => 'error', 'message' => 'No hay sesión activa']);
    exit;
}

// Verificar que se recibieron los datos
if (!isset($_POST['password_actual']) || !isset($_POST['password_nueva'])) {
    echo json_encode(['status' => 'error', 'message' => 'Faltan datos requeridos']);
    exit;
}

// Obtener datos
$id_usuario = $_SESSION['S_ID_USUARIO'];
$password_actual = $_POST['password_actual'];
$password_nueva = $_POST['password_nueva'];

// Instanciar modelo
$MU = new Modelo_Usuario();

// Verificar que la contraseña actual sea correcta
$usuario = $MU->verificarUsuario($_SESSION['S_USUARIO'], $password_actual);

if (!$usuario) {
    echo json_encode(['status' => 'error', 'message' => 'La contraseña actual es incorrecta']);
    exit;
}

// Cambiar contraseña
$resultado = $MU->cambiarContrasena($id_usuario, $password_nueva);

if ($resultado == 1) {
    echo json_encode(['status' => 'success', 'message' => 'Contraseña cambiada correctamente']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Error al cambiar la contraseña']);
}
exit;
?>