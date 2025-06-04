<?php
require '../../modelo/modelo-resultado.php';

// Obtener datos enviados
$resultado_id = htmlspecialchars(trim($_POST['resultado_id']), ENT_QUOTES, 'UTF-8');
$detalle_id = htmlspecialchars(trim($_POST['detalle_id']), ENT_QUOTES, 'UTF-8');
$nombre_archivo = htmlspecialchars(trim($_POST['nombre_archivo']), ENT_QUOTES, 'UTF-8');

// Definir ruta para el archivo
$ruta = "controller/resultado/archivos/" . $nombre_archivo;

// Instanciar modelo
$MR = new Modelo_Resultado();

// Registrar detalle
$resultado = $MR->registrarResultadoDetalle($resultado_id, $detalle_id, $ruta);

// Si el registro fue exitoso
if($resultado == 1) {
    // Verificar si existe la carpeta, si no crearla
    if(!file_exists("../../controller/resultado/archivos/")) {
        mkdir("../../controller/resultado/archivos/", 0777, true);
    }
    
    // Mover el archivo subido
    if(isset($_FILES['archivo'])) {
        move_uploaded_file($_FILES['archivo']['tmp_name'], "../../" . $ruta);
    }
}

// Retornar resultado
echo $resultado;
?>
