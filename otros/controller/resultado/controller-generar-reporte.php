<?php
require '../../modelo/modelo-resultado.php';
require '../../vendor/autoload.php'; // Requiere FPDF (agregar mediante Composer o descargar manualmente)

// Verificar si se recibió el ID
if(!isset($_GET['id'])) {
    die("Error: No se proporcionó el ID del resultado");
}

$resultado_id = htmlspecialchars(trim($_GET['id']), ENT_QUOTES, 'UTF-8');

// Instanciar modelo
$MR = new Modelo_Resultado();

// Obtener datos del resultado
$resultado = $MR->obtenerResultado($resultado_id);

// Obtener detalles del resultado
$detalles = $MR->obtenerDetalleResultado($resultado_id);

// Si no hay datos, mostrar error
if(empty($resultado)) {
    die("Error: No se encontró el resultado solicitado");
}

// Crear reporte PDF
// Nota: Esta es una implementación básica, se puede mejorar la presentación
use setasign\Fpdi\Fpdi;

class PDF extends Fpdi {
    function Header() {
        $this->SetFont('Arial', 'B', 14);
        $this->Cell(0, 10, 'REPORTE DE RESULTADOS DE LABORATORIO', 0, 1, 'C');
        $this->Ln(5);
    }
    
    function Footer() {
        $this->SetY(-15);
        $this->SetFont('Arial', 'I', 8);
        $this->Cell(0, 10, 'Página ' . $this->PageNo() . '/{nb}', 0, 0, 'C');
    }
}

// Crear PDF
$pdf = new PDF();
$pdf->AliasNbPages();
$pdf->AddPage();

// Datos del paciente
$pdf->SetFont('Arial', 'B', 12);
$pdf->Cell(0, 10, 'Datos del Paciente', 0, 1, 'L');
$pdf->SetFont('Arial', '', 10);
$pdf->Cell(40, 7, 'Nombre:', 0, 0, 'L');
$pdf->Cell(90, 7, $resultado['paciente'], 0, 0, 'L');
$pdf->Cell(20, 7, 'DNI:', 0, 0, 'L');
$pdf->Cell(40, 7, $resultado['paciente_dni'], 0, 1, 'L');

// Datos del médico y fecha
$pdf->Cell(40, 7, 'Médico:', 0, 0, 'L');
$pdf->Cell(90, 7, $resultado['medico'], 0, 0, 'L');
$pdf->Cell(20, 7, 'Fecha:', 0, 0, 'L');
$pdf->Cell(40, 7, $resultado['fecha_registro'], 0, 1, 'L');

// Responsable
$pdf->Cell(40, 7, 'Responsable:', 0, 0, 'L');
$pdf->Cell(90, 7, $resultado['usuario'], 0, 1, 'L');
$pdf->Ln(5);

// Detalles de los exámenes
$pdf->SetFont('Arial', 'B', 12);
$pdf->Cell(0, 10, 'Exámenes Realizados', 0, 1, 'L');
$pdf->SetFont('Arial', 'B', 10);
$pdf->Cell(90, 7, 'Examen', 1, 0, 'C');
$pdf->Cell(90, 7, 'Análisis', 1, 1, 'C');

$pdf->SetFont('Arial', '', 10);
foreach($detalles as $detalle) {
    $pdf->Cell(90, 7, $detalle['examen_nombre'], 1, 0, 'L');
    $pdf->Cell(90, 7, $detalle['analisis_nombre'], 1, 1, 'L');
}
$pdf->Ln(5);

// Nota: Para una implementación completa, se podrían incluir los resultados y parámetros de referencia

// Firma
$pdf->Ln(20);
$pdf->Cell(0, 0, '____________________________', 0, 1, 'C');
$pdf->Cell(0, 10, 'Firma y Sello', 0, 1, 'C');

// Salida del PDF
$pdf->Output('Resultado_' . $resultado_id . '.pdf', 'I');
?>
