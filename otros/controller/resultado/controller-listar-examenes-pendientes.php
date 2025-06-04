<?php
require '../../modelo/modelo-resultado.php';

// Instanciar modelo
$MR = new Modelo_Resultado();

// Obtener lista de exámenes pendientes
$resultado = $MR->listarExamenesPendientes();

// Retornar como JSON
echo json_encode($resultado);
?>
