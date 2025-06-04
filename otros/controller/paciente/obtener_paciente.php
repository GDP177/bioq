<?php
require '../../modelo/modelo-paciente.php';

// Verificar si se recibió el nro_ficha
if (!isset($_POST['nro_ficha'])) {
    echo json_encode(['error' => 'No se proporcionó el número de ficha']);
    exit;
}

$nro_ficha = (int)$_POST['nro_ficha'];

// Instanciar modelo
$MP = new Modelo_Paciente();

// Obtener datos del paciente
$paciente = $MP->obtenerPaciente($nro_ficha);

// Devolver como JSON
echo json_encode($paciente);
exit;
?>