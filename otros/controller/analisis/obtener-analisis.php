<?php
require '../../modelo/modelo-analisis.php';

// Verificar si se recibió el código de práctica
if (!isset($_POST['codigo_practica'])) {
    echo json_encode(null);
    exit;
}

$codigo_practica = (int)$_POST['codigo_practica'];

// Obtener datos del análisis
$c = conexionBD::conexionPDO();
$sql = "SELECT * FROM analisis WHERE CODIGO_DE_PRACTICA = ?";
$query = $c->prepare($sql);
$query->bindParam(1, $codigo_practica);
$query->execute();
$analisis = $query->fetch(PDO::FETCH_ASSOC);

// Retornar resultados en formato JSON
echo json_encode($analisis);
?>