<?php
require_once 'plantilla/cabecera.php';
require_once 'plantilla/menu.php';
?>

<script>
    // Establecer título de la página
    document.getElementById('titulo_principal').innerText = 'Dashboard';
    document.getElementById('breadcrumb_pagina').innerText = 'Dashboard';
</script>

<!-- Dashboard content -->
<div class="row">
    <div class="col-lg-3 col-6">
        <!-- small box -->
        <div class="small-box bg-info">
            <div class="inner">
                <h3 id="total_ordenes">0</h3>
                <p>Órdenes Totales</p>
            </div>
            <div class="icon">
                <i class="fas fa-clipboard-list"></i>
            </div>
            <a href="orden/index.php" class="small-box-footer">Más información <i class="fas fa-arrow-circle-right"></i></a>
        </div>
    </div>
    <!-- ./col -->
    <div class="col-lg-3 col-6">
        <!-- small box -->
        <div class="small-box bg-success">
            <div class="inner">
                <h3 id="total_pacientes">0</h3>
                <p>Pacientes Registrados</p>
            </div>
            <div class="icon">
                <i class="fas fa-user-injured"></i>
            </div>
            <a href="paciente/index.php" class="small-box-footer">Más información <i class="fas fa-arrow-circle-right"></i></a>
        </div>
    </div>
    <!-- ./col -->
    <div class="col-lg-3 col-6">
        <!-- small box -->
        <div class="small-box bg-warning">
            <div class="inner">
                <h3 id="total_analisis">0</h3>
                <p>Análisis Disponibles</p>
            </div>
            <div class="icon">
                <i class="fas fa-vial"></i>
            </div>
            <a href="analisis/index.php" class="small-box-footer">Más información <i class="fas fa-arrow-circle-right"></i></a>
        </div>
    </div>
    <!-- ./col -->
    <div class="col-lg-3 col-6">
        <!-- small box -->
        <div class="small-box bg-danger">
            <div class="inner">
                <h3 id="ordenes_pendientes">0</h3>
                <p>Órdenes Pendientes</p>
            </div>
            <div class="icon">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <a href="orden/pendientes.php" class="small-box-footer">Más información <i class="fas fa-arrow-circle-right"></i></a>
        </div>
    </div>
    <!-- ./col -->
</div>
<!-- /.row -->

<!-- Órdenes recientes y Urgentes -->
<div class="row">
    <div class="col-md-8">
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Órdenes Recientes</h3>
            </div>
            <!-- /.card-header -->
            <div class="card-body">
                <table class="table table-bordered table-striped" id="tabla_ordenes_recientes">
                    <thead>
                        <tr>
                            <th>ID Orden</th>
                            <th>Paciente</th>
                            <th>Médico</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody id="tbody_ordenes_recientes">
                        <tr>
                            <td colspan="5" class="text-center">Cargando datos...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <!-- /.card-body -->
        </div>
        <!-- /.card -->
    </div>
    <!-- /.col -->
    
    <div class="col-md-4">
        <div class="card">
            <div class="card-header bg-danger">
                <h3 class="card-title">Órdenes Urgentes</h3>
            </div>
            <!-- /.card-header -->
            <div class="card-body">
                <table class="table table-bordered" id="tabla_ordenes_urgentes">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Paciente</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody id="tbody_ordenes_urgentes">
                        <tr>
                            <td colspan="3" class="text-center">Cargando datos...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <!-- /.card-body -->
        </div>
        <!-- /.card -->
    </div>
    <!-- /.col -->
</div>
<!-- /.row -->

<script>
    $(document).ready(function() {
        // Cargar estadísticas
        cargarEstadisticas();
        
        // Cargar órdenes recientes
        cargarOrdenesRecientes();
        
        // Cargar órdenes urgentes
        cargarOrdenesUrgentes();
    });
    
    /**
     * Carga las estadísticas del dashboard
     */
    function cargarEstadisticas() {
        $.ajax({
            url: '../controller/dashboard/estadisticas.php',
            type: 'POST',
            dataType: 'json',
            success: function(response) {
                // Actualizar contadores
                $('#total_ordenes').text(response.total_ordenes || 0);
                $('#total_pacientes').text(response.total_pacientes || 0);
                $('#total_analisis').text(response.total_analisis || 0);
                $('#ordenes_pendientes').text(response.ordenes_pendientes || 0);
            },
            error: function() {
                console.error('Error al cargar estadísticas');
            }
        });
    }
    
    /**
     * Carga las órdenes recientes
     */
    function cargarOrdenesRecientes() {
        $.ajax({
            url: '../controller/dashboard/ordenes_recientes.php',
            type: 'POST',
            dataType: 'json',
            success: function(response) {
                // Limpiar tabla
                $('#tbody_ordenes_recientes').empty();
                
                // Si hay órdenes
                if (response && response.length > 0) {
                    response.forEach(function(orden) {
                        // Determinar clase según estado
                        let clase = orden.realizados_completados ? 'bg-success' : 'bg-warning';
                        let estado = orden.realizados_completados ? 'Completada' : 'Pendiente';
                        
                        let fila = `
                            <tr>
                                <td>${orden.id_orden}</td>
                                <td>${orden.paciente}</td>
                                <td>${orden.medico_solicitante}</td>
                                <td>${orden.fecha_ingreso}</td>
                                <td><span class="badge ${clase}">${estado}</span></td>
                            </tr>
                        `;
                        $('#tbody_ordenes_recientes').append(fila);
                    });
                } else {
                    $('#tbody_ordenes_recientes').html('<tr><td colspan="5" class="text-center">No hay órdenes recientes</td></tr>');
                }
            },
            error: function() {
                $('#tbody_ordenes_recientes').html('<tr><td colspan="5" class="text-center">Error al cargar órdenes recientes</td></tr>');
            }
        });
    }
    
    /**
     * Carga las órdenes urgentes
     */
    function cargarOrdenesUrgentes() {
        $.ajax({
            url: '../controller/dashboard/ordenes_urgentes.php',
            type: 'POST',
            dataType: 'json',
            success: function(response) {
                // Limpiar tabla
                $('#tbody_ordenes_urgentes').empty();
                
                // Si hay órdenes urgentes
                if (response && response.length > 0) {
                    response.forEach(function(orden) {
                        let fila = `
                            <tr>
                                <td>${orden.id_orden}</td>
                                <td>${orden.paciente}</td>
                                <td>${orden.fecha_ingreso}</td>
                            </tr>
                        `;
                        $('#tbody_ordenes_urgentes').append(fila);
                    });
                } else {
                    $('#tbody_ordenes_urgentes').html('<tr><td colspan="3" class="text-center">No hay órdenes urgentes</td></tr>');
                }
            },
            error: function() {
                $('#tbody_ordenes_urgentes').html('<tr><td colspan="3" class="text-center">Error al cargar órdenes urgentes</td></tr>');
            }
        });
    }
</script>

<?php
require_once 'plantilla/pie.php';
?>