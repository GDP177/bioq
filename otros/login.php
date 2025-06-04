<?php
// Verificar si hay una sesión activa
session_start();
if (isset($_SESSION['S_USUARIO'])) {
    // Si hay sesión, redireccionar al dashboard
    header('Location: vista/index.php');
    exit;
} else {
    // Si no hay sesión, redireccionar a la página de login
    header('Location: vista/login/login.php');
    exit;
}
?>