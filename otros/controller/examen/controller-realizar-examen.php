<?php
session_start();
require '../../modelo/modelo_realizar_examen.php';

// Obtener los datos enviados
$paciente_id = htmlspecialchars(trim($_POST['paciente_id']), ENT_QUOTES, 'UTF-8');
$medico_id = htmlspecialchars(trim($_POST['medico_id']), ENT_QUOTES, 'UTF-8');
$usuario_id = $_SESSION['S_ID_USUARIO']; // ID del usuario de la sesión

// Instanciar modelo
$MRE = new Modelo_Realizar_Examen();

// Registrar cabecera
$consulta = $MRE->registrarRealizarExamen($paciente_id, $usuario_id, $medico_id);

// Retornar el ID generado o 0 en caso de error
echo $consulta;
?>
