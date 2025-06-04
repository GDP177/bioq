<?php
require '../../modelo/modelo_examen.php';

// Obtener ID del análisis
$analisis_id = htmlspecialchars(trim($_POST['id']), ENT_QUOTES, 'UTF-8');

// Instanciar modelo
$ME = new Modelo_Examen();

// Cargar exámenes por análisis
$consulta = $ME->listarExamenesPorAnalisis($analisis_id);

// Devolver JSON
echo json_encode($consulta);
?>
