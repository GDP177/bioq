<?php
session_start();
require '../../modelo/modelo-resultado.php';

// Obtener datos enviados
$realizar_examen_id = htmlspecialchars(trim($_POST['realizar_examen_id']), ENT_QUOTES, 'UTF-8');
$usuario_id = $_SESSION['S_ID_USUARIO']; // ID del usuario de la sesión

// Instanciar modelo
$MR = new Modelo_Resultado();

// Registrar cabecera
$resultado = $MR->registrarResultado($realizar_examen_id, $usuario_id);

// Retornar ID generado o error
echo $resultado;
?>
