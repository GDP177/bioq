<?php
require '../../modelo/modelo-valor-referencia.php';

// Verificar si se recibió el código de práctica
if (!isset($_POST['codigo_practica'])) {
    echo json_encode([]);
    exit;
}

$codigo_practica = (int)$_POST['codigo_practica'];

// Instanciar modelo
$MVR = new Modelo_Valor_Referencia();

// Obtener valores de referencia para el análisis
$valores = $MVR->obtenerValoresReferenciaAnalisis($codigo_practica);

// Retornar resultados en formato JSON
echo json_encode($valores);
?>