<?php
// Verificar si hay una sesión activa
session_start();
if (isset($_SESSION['S_USUARIO'])) {
    // Si hay sesión, redireccionar al dashboard
    header('Location: vista/index.php');
    exit;
} else {
    // Si no hay sesión, redireccionar al login
    header('Location: login.php');
    exit;
}
?>