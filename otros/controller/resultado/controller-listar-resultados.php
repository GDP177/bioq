<?php
require '../../modelo/modelo-resultado.php';

// Instanciar modelo
$MR = new Modelo_Resultado();

// Obtener lista de resultados
$consulta = $MR->listarResultados();

// Si hay resultados, devolverlos en formato JSON
if($consulta) {
    echo json_encode($consulta);
} else {
    // Si no hay resultados, devolver estructura básica para DataTables
    echo '{
        "data": []
    }';
}
?>
