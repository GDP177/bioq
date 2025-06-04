<?php
require '../../modelo/modelo-paciente.php';

// Verificar si se recibió el valor de búsqueda
if (!isset($_POST['valor'])) {
    echo json_encode([]);
    exit;
}

$valor = htmlspecialchars(trim($_POST['valor']), ENT_QUOTES, 'UTF-8');

// Instanciar modelo
$MP = new Modelo_Paciente();

// Buscar pacientes
$resultado = $MP->buscarPacientes($valor);

// Retornar resultados en formato JSON
echo json_encode($resultado);
?>