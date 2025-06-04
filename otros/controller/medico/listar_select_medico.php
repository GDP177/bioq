<?php
require '../../modelo/modelo-medico.php';

// Instanciar modelo
$MM = new Modelo_Medico();

// Buscar médicos activos para select
$consulta = $MM->listarSelectMedico();

// Si hay consulta, devolver en formato JSON
if($consulta) {
    echo json_encode($consulta);
} else {
    echo json_encode([]);
}
?>