<?php
require_once '../plantilla/cabecera.php';
require_once '../plantilla/menu.php';
?>

<script>
    // Establecer título de la página
    document.getElementById('titulo_principal').innerText = 'Órdenes Pendientes';
    document.getElementById('breadcrumb_pagina').innerText = 'Órdenes Pendientes';
</script>

<!-- Contenido principal -->
<div class="row">
    <div class="col-md-12">
        <div class="card card-danger">
            <div class="card-header">
                <h3 class="card-title">Listado de Órdenes Pendientes</h3>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table id="tabla_ordenes_pendientes" class="table table-bordered table-striped">
                        <thead>
                            <tr>
                                <th>ID Orden</th>
                                <th>Paciente</th>
                                <th>DNI</th>
                                <th>Médico</th>
                                <th>Fecha Ingreso</th>
                                <th>Urgente</th>
                                <th>Análisis Pendientes</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Los datos se cargarán dinámicamente -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Modal para ver detalles de la orden -->
<div class="modal fade" id="modal_detalle_orden">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header bg-primary">
                <h4 class="modal-title">Detalles de la Orden</h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label>Orden #:</label>
                            <input type="text" class="form-control" id="txt_id_orden" readonly>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <label>Fecha:</label>
                            <input type="text" class="form-control" id="txt_fecha" readonly>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label>Paciente:</label>
                            <input type="text" class="form-control" id="txt_paciente" readonly>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <label>DNI:</label>
                            <input type="text" class="form-control" id="txt_dni" readonly>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <div class="form-group">
                            <label>Médico:</label>
                            <input type="text" class="form-control" id="txt_medico" readonly>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <h5 class="mt-3 mb-3">Análisis Pendientes</h5>
                        <table class="table table-bordered table-striped">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Análisis</th>
                                    <th>Módulo</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody id="tbody_analisis_pendientes">
                                <!-- Los análisis pendientes se cargarán dinámicamente -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Cerrar</button>
                <button type="button" class="btn btn-success" id="btn_registrar_valores">Registrar Resultados</button>
                <button type="button" class="btn btn-primary" id="btn_generar_reporte">Generar Reporte</button>
            </div>
        </div>
    </div>
</div>

<script>
    $(document).ready(function() {
        // Inicializar DataTable
        var tabla = $('#tabla_ordenes_pendientes').DataTable({
            "ajax": {
                "url": "../../controller/orden/listar_ordenes_pendientes.php",
                "type": "POST",
                "dataSrc": ""
            },
            "columns": [
                { "data": "id_orden" },
                { "data": "paciente" },
                { "data": "DNI" },
                { "data": "medico_solicitante" },
                { "data": "fecha_ingreso" },
                { 
                    "data": "urgente",
                    "render": function(data) {
                        return data == 1 ? 
                            '<span class="badge badge-danger">URGENTE</span>' : 
                            '<span class="badge badge-info">Normal</span>';
                    } 
                },
                { "data": "analisis_pendientes" },
                { 
                    "defaultContent": `
                        <button class="btn btn-primary btn-sm ver_detalle" title="Ver Detalle">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-success btn-sm registrar_resultados" title="Registrar Resultados">
                            <i class="fas fa-flask"></i>
                        </button>
                        <button class="btn btn-info btn-sm generar_reporte" title="Generar Reporte">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                    ` 
                }
            ],
            "language": {
                "url": "//cdn.datatables.net/plug-ins/1.10.25/i18n/Spanish.json"
            },
            "responsive": true,
            "order": [[5, 'desc'], [4, 'asc']] // Ordenar por urgente y luego por fecha
        });
        
        // Ver detalle de orden
        $('#tabla_ordenes_pendientes tbody').on('click', '.ver_detalle', function() {
            let data = tabla.row($(this).parents('tr')).data();
            cargarDetalleOrden(data.id_orden);
        });
        
        // Registrar resultados
        $('#tabla_ordenes_pendientes tbody').on('click', '.registrar_resultados', function() {
            let data = tabla.row($(this).parents('tr')).data();
            window.location.href = 'registrar_resultados.php?id=' + data.id_orden;
        });
        
        // Generar reporte
        $('#tabla_ordenes_pendientes tbody').on('click', '.generar_reporte', function() {
            let data = tabla.row($(this).parents('tr')).data();
            window.open('../../controller/orden/generar_reporte.php?id=' + data.id_orden, '_blank');
        });
        
        // Botón para registrar resultados desde el modal
        $('#btn_registrar_valores').click(function() {
            let id_orden = $('#txt_id_orden').val();
            window.location.href = 'registrar_resultados.php?id=' + id_orden;
        });
        
        // Botón para generar reporte desde el modal
        $('#btn_generar_reporte').click(function() {
            let id_orden = $('#txt_id_orden').val();
            window.open('../../controller/orden/generar_reporte.php?id=' + id_orden, '_blank');
        });
    });
    
    /**
     * Carga los detalles de una orden
     * @param {int} id_orden ID de la orden
     */
    function cargarDetalleOrden(id_orden) {
        $.ajax({
            url: '../../controller/orden/obtener_detalle_orden.php',
            type: 'POST',
            data: {
                id_orden: id_orden
            },
            dataType: 'json',
            success: function(response) {
                if(response.error) {
                    Swal.fire({
                        title: 'Error',
                        text: response.error,
                        icon: 'error'
                    });
                    return;
                }
                
                // Cargar datos de la orden
                $('#txt_id_orden').val(response.orden.id_orden);
                $('#txt_fecha').val(response.orden.fecha_ingreso);
                $('#txt_paciente').val(response.orden.paciente);
                $('#txt_dni').val(response.orden.DNI);
                $('#txt_medico').val(response.orden.medico_solicitante);
                
                // Cargar análisis pendientes
                $('#tbody_analisis_pendientes').empty();
                
                response.analisis_pendientes.forEach(function(analisis) {
                    let fila = `
                        <tr>
                            <td>${analisis.codigo_practica}</td>
                            <td>${analisis.descripcion_practica}</td>
                            <td>${analisis.descripcion_modulo}</td>
                            <td>
                                <button class="btn btn-success btn-sm" onclick="marcarRealizado(${response.orden.id_orden}, ${analisis.codigo_practica})">
                                    <i class="fas fa-check"></i> Marcar Realizado
                                </button>
                            </td>
                        </tr>
                    `;
                    $('#tbody_analisis_pendientes').append(fila);
                });
                
                // Mostrar modal
                $('#modal_detalle_orden').modal('show');
            },
            error: function() {
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudo cargar los detalles de la orden',
                    icon: 'error'
                });
            }
        });
    }
    
    /**
     * Marca un análisis como realizado
     * @param {int} id_orden ID de la orden
     * @param {int} codigo_practica Código de la práctica
     */
    function marcarRealizado(id_orden, codigo_practica) {
        Swal.fire({
            title: '¿Marcar como realizado?',
            text: "¿Está seguro de marcar este análisis como realizado?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, marcar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '../../controller/orden/marcar_analisis_realizado.php',
                    type: 'POST',
                    data: {
                        id_orden: id_orden,
                        codigo_practica: codigo_practica
                    },
                    dataType: 'json',
                    success: function(response) {
                        if(response.status === 'success') {
                            Swal.fire({
                                title: 'Éxito',
                                text: 'Análisis marcado como realizado correctamente',
                                icon: 'success'
                            }).then(() => {
                                // Recargar datos
                                $('#modal_detalle_orden').modal('hide');
                                $('#tabla_ordenes_pendientes').DataTable().ajax.reload();
                            });
                        } else {
                            Swal.fire({
                                title: 'Error',
                                text: response.message || 'Error al marcar el análisis como realizado',
                                icon: 'error'
                            });
                        }
                    },
                    error: function() {
                        Swal.fire({
                            title: 'Error',
                            text: 'No se pudo procesar la solicitud',
                            icon: 'error'
                        });
                    }
                });
            }
        });
    }
</script>

<?php
require_once '../plantilla/pie.php';
?>