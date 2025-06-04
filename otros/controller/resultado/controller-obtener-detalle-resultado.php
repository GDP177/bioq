<?php
require '../../modelo/modelo-resultado.php';

// Obtener ID del resultado
$resultado_id = htmlspecialchars(trim($_POST['id']), ENT_QUOTES, 'UTF-8');

// Instanciar modelo
$MR = new Modelo_Resultado();

// Obtener detalles del resultado
$consulta = $MR->obtenerDetalleResultado($resultado_id);

// Devolver como JSON
echo json_encode($consulta);
?>
