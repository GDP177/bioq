<?php
require '../../modelo/modelo-orden.php';
require '../../vendor/autoload.php'; // Asegúrate de tener FPDF instalado via Composer

// Verificar si se recibió el ID
if(!isset($_GET['id'])) {
    die("Error: No se proporcionó el ID de la orden");
}

$id_orden = (int)$_GET['id'];

// Instanciar modelo
$MO = new Modelo_Orden();

// Obtener datos de la orden
$orden = $MO->obtenerOrden($id_orden);

if (!$orden) {
    die("Error: No se encontró la orden solicitada");
}

// Obtener análisis de la orden
$analisis = $MO->obtenerAnalisisOrden($id_orden);

// Incluir FPDF
use FPDF;

// Crear PDF
class PDF extends FPDF {
    function Header() {
        // Logo
        //$this->Image('../../assets/img/logo.png', 10, 6, 30);
        // Arial bold 15
        $this->SetFont('Arial', 'B', 15);
        // Título
        $this->Cell(0, 10, 'SISTEMA DE LABORATORIO BIOQUIMICO', 0, 1, 'C');
        $this->SetFont('Arial', 'B', 12);
        $this->Cell(0, 10, 'REPORTE DE ORDEN', 0, 1, 'C');
        // Salto de línea
        $this->Ln(5);
    }
    
    function Footer() {
        // Posición a 1.5 cm del final
        $this->SetY(-15);
        // Arial italic 8
        $this->SetFont('Arial', 'I', 8);
        // Número de página
        $this->Cell(0, 10, 'Página ' . $this->PageNo() . '/{nb}', 0, 0, 'C');
    }
}

// Crear instancia de PDF
$pdf = new PDF();
$pdf->AliasNbPages();
$pdf->AddPage();

// Datos de la orden
$pdf->SetFont('Arial', 'B', 12);
$pdf->Cell(0, 10, 'ORDEN #' . $orden['id_orden'], 0, 1, 'L');
$pdf->SetFont('Arial', '', 10);

// Datos del paciente
$pdf->SetFont('Arial', 'B', 11);
$pdf->Cell(0, 7, 'Datos del Paciente:', 0, 1, 'L');
$pdf->SetFont('Arial', '', 10);
$pdf->Cell(30, 7, 'Paciente:', 0, 0);
$pdf->Cell(80, 7, $orden['paciente'], 0, 1);
$pdf->Cell(30, 7, 'DNI:', 0, 0);
$pdf->Cell(80, 7, $orden['DNI'], 0, 1);

// Datos del médico
$pdf->SetFont('Arial', 'B', 11);
$pdf->Cell(0, 7, 'Datos del Médico:', 0, 1, 'L');
$pdf->SetFont('Arial', '', 10);
$pdf->Cell(30, 7, 'Médico:', 0, 0);
$pdf->Cell(80, 7, $orden['medico_solicitante'], 0, 1);

// Datos del bioquímico
if (!empty($orden['bioquimico'])) {
    $pdf->Cell(30, 7, 'Bioquímico:', 0, 0);
    $pdf->Cell(80, 7, $orden['bioquimico'], 0, 1);
}

// Fecha
$pdf->Cell(30, 7, 'Fecha:', 0, 0);
$pdf->Cell(80, 7, $orden['fecha_ingreso'], 0, 1);

// Urgencia
$pdf->Cell(30, 7, 'Prioridad:', 0, 0);
$pdf->Cell(80, 7, $orden['urgente'] == 1 ? 'URGENTE' : 'Normal', 0, 1);

$pdf->Ln(5);

// Análisis solicitados
$pdf->SetFont('Arial', 'B', 11);
$pdf->Cell(0, 7, 'Análisis Solicitados:', 0, 1, 'L');
$pdf->SetFont('Arial', 'B', 10);

// Tabla de análisis
$pdf->Cell(20, 7, 'Código', 1, 0, 'C');
$pdf->Cell(80, 7, 'Análisis', 1, 0, 'C');
$pdf->Cell(50, 7, 'Módulo', 1, 0, 'C');
$pdf->Cell(40, 7, 'Estado', 1, 1, 'C');

$pdf->SetFont('Arial', '', 10);
foreach ($analisis as $item) {
    $pdf->Cell(20, 7, $item['Codigo_de_practica'], 1, 0, 'C');
    $pdf->Cell(80, 7, $item['DESCRIPCION_DE_PRACTICA'], 1, 0);
    $pdf->Cell(50, 7, $item['DESCRIPCION_DE_MODULO'], 1, 0);
    $estado = empty($item['fecha_realizacion_analisis']) ? 'Pendiente' : 'Realizado';
    $pdf->Cell(40, 7, $estado, 1, 1, 'C');
}

$pdf->Ln(10);

// Firmas
$pdf->Cell(95, 7, 'Firma del Bioquímico', 0, 0, 'C');
$pdf->Cell(95, 7, 'Firma del Paciente', 0, 1, 'C');
$pdf->Cell(95, 30, '', 0, 0);
$pdf->Cell(95, 30, '', 0, 1);
$pdf->Cell(95, 7, '________________________', 0, 0, 'C');
$pdf->Cell(95, 7, '________________________', 0, 1, 'C');

// Generar archivo
$pdf->Output('Orden_' . $id_orden . '.pdf', 'I');
exit;
?>