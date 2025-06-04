<?php
require '../../modelo/modelo_analisis.php';

// Instanciar modelo
$MA = new Modelo_Analisis();

// Cargar los análisis para el select
$consulta = $MA->listarSelectAnalisis();

// Si hay resultados, retornar como JSON
if($consulta) {
    echo json_encode($consulta);
} else {
    echo '[]';
}
?>
