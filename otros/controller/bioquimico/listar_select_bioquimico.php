<?php
require '../../modelo/modelo-bioquimico.php';

// Instanciar modelo
$MB = new Modelo_Bioquimico();

// Buscar bioquímicos para select
$consulta = $MB->listarSelectBioquimico();

// Si hay consulta, devolver en formato JSON
if($consulta) {
    echo json_encode($consulta);
} else {
    echo json_encode([]);
}
?>