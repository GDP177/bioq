<?php
require '../../modelo/modelo_realizar_examen.php';

// Obtener los datos enviados
$id = htmlspecialchars(trim($_POST['id']), ENT_QUOTES, 'UTF-8');
$examenArray = explode(',', $_POST['examen']);
$analisisArray = explode(',', $_POST['analisis']);

// Instanciar modelo
$MRE = new Modelo_Realizar_Examen();

// Contador para registros exitosos
$contador = 0;

// Registrar cada detalle
for($i = 0; $i < count($examenArray); $i++) {
    $examen_id = $examenArray[$i];
    $analisis_id = $analisisArray[$i];
    
    $resultado = $MRE->registrarRealizarExamenDetalle($id, $examen_id, $analisis_id);
    
    if($resultado > 0) {
        $contador++;
    }
}

// Si todos se registraron correctamente
if($contador === count($examenArray)) {
    echo "1";
} else {
    echo "0";
}
?>
