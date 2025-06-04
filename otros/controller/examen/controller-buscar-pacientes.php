<?php
require '../../modelo/modelo_realizar_examen.php';

// Obtener el valor de búsqueda
$valor = htmlspecialchars(trim($_POST['valor']), ENT_QUOTES, 'UTF-8');

// Instanciar modelo
$MRE = new Modelo_Realizar_Examen();

// Buscar pacientes
$resultado = $MRE->buscarPacientes($valor);

// Retornar resultados en formato JSON
echo json_encode($resultado);
?>
