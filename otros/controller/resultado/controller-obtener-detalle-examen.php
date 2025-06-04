<?php
require '../../modelo/modelo-resultado.php';

// Obtener ID del examen
$realizar_examen_id = htmlspecialchars(trim($_POST['id']), ENT_QUOTES, 'UTF-8');

// Instanciar modelo
$MR = new Modelo_Resultado();

// Obtener detalles del examen
$resultado = $MR->obtenerDetalleExamen($realizar_examen_id);

// Retornar como JSON
echo json_encode($resultado);
?>
