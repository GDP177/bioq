<?php
require_once '../plantilla/cabecera.php';
require_once '../plantilla/menu.php';

// Verificar que se haya recibido el ID de orden
if (!isset($_GET['id'])) {
    echo '<script>window.location.href = "pendientes.php";</script>';
    exit;
}

$id_orden = (int)$_GET['id'];
?>

<script>
    // Establecer título de la página
    document.getElementById('titulo_principal').innerText = 'Registrar Resultados';
    document.getElementById('breadcrumb_pagina').innerText = 'Registrar Resultados';
</script>

<!-- Contenido principal -->
<div class="row">
    <div class="col-md-12">
        <div class="card card-success">
            <div class="card-header">
                <h3 class="card-title">Registro de Resultados - Orden #<span id="num_orden"><?php echo $id_orden; ?></span></h3>
            </div>
            <div class="card-body">
                <!-- Datos de la orden -->
                <div class="row">
                    <div class="col-md-12">
                        <div class="card card-info">
                            <div class="card-header">
                                <h3 class="card-title">Datos de la Orden</h3>
                            </div>
                            <div class="card-body">
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
                                    <div class="col-md-6">
                                        <div class="form-group">
                                            <label>Médico:</label>
                                            <input type="text" class="form-control" id="txt_medico" readonly>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <label>Fecha:</label>
                                            <input type="text" class="form-control" id="txt_fecha" readonly>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <label>Prioridad:</label>
                                            <input type="text" class="form-control" id="txt_urgente" readonly>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Análisis pendientes -->
                <div class="row mt-3">
                    <div class="col-md-12">
                        <div class="card card-primary">
                            <div class="card-header">
                                <h3 class="card-title">Análisis Pendientes</h3>
                            </div>
                            <div class="card-body" id="contenedor_analisis">
                                <!-- Aquí se cargarán dinámicamente los análisis pendientes -->
                                <div class="text-center">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="sr-only">Cargando...</span>
                                    </div>
                                    <p>Cargando análisis pendientes...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Botones de acción -->
                <div class="row mt-3">
                    <div class="col-md-12 text-center">
                        <button type="button" class="btn btn-secondary mr-2" onclick="window.location.href='pendientes.php'">
                            <i class="fas fa-arrow-left"></i> Volver
                        </button>
                        <button type="button" class="btn btn-success" id="btn_guardar_resultados">
                            <i class="fas fa-save"></i> Guardar Todos los Resultados
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    // ID de la orden
    const id_orden = <?php echo $id_orden; ?>;
    
    $(document).ready(function() {
        // Cargar datos de la orden
        cargarDatosOrden(id_orden);
        
        // Botón para guardar todos los resultados
        $('#btn_guardar_resultados').click(function() {
            guardarTodosLosResultados();
        });
    });
    
    /**
     * Carga los datos de la orden
     * @param {int} id_orden ID de la orden
     */
    function cargarDatosOrden(id_orden) {
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
                    }).then(() => {
                        window.location.href = 'pendientes.php';
                    });
                    return;
                }
                
                // Cargar datos de la orden
                $('#txt_paciente').val(response.orden.paciente);
                $('#txt_dni').val(response.orden.DNI);
                $('#txt_medico').val(response.orden.medico_solicitante);
                $('#txt_fecha').val(response.orden.fecha_ingreso);
                $('#txt_urgente').val(response.orden.urgente == 1 ? 'URGENTE' : 'Normal');
                
                // Si no hay análisis pendientes
                if (response.analisis_pendientes.length === 0) {
                    $('#contenedor_analisis').html('<div class="alert alert-warning">No hay análisis pendientes para esta orden.</div>');
                    $('#btn_guardar_resultados').prop('disabled', true);
                    return;
                }
                
                // Limpiar contenedor
                $('#contenedor_analisis').empty();
                
                // Cargar análisis pendientes
                response.analisis_pendientes.forEach(function(analisis, index) {
                    cargarFormularioAnalisis(analisis, index);
                });
            },
            error: function() {
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudo cargar los datos de la orden',
                    icon: 'error'
                }).then(() => {
                    window.location.href = 'pendientes.php';
                });
            }
        });
    }
    
    /**
     * Carga el formulario para registrar los resultados de un análisis
     * @param {object} analisis Datos del análisis
     * @param {int} index Índice para crear IDs únicos
     */
    function cargarFormularioAnalisis(analisis, index) {
        // Crear un contenedor para el análisis
        let contenedor = $('<div></div>')
            .addClass('card mb-3')
            .attr('id', 'analisis_' + analisis.codigo_practica);
            
        // Cabecera del análisis
        let cabecera = $('<div></div>')
            .addClass('card-header bg-light')
            .append(
                $('<h5></h5>')
                    .addClass('card-title')
                    .text(analisis.descripcion_practica + ' - ' + analisis.descripcion_modulo)
            )
            .append(
                $('<h6></h6>')
                    .addClass('card-subtitle text-muted')
                    .text('Código: ' + analisis.codigo_practica)
            );
            
        // Cuerpo del análisis
        let cuerpo = $('<div></div>').addClass('card-body');
        
        // Cargar valores de referencia para este análisis
        $.ajax({
            url: '../../controller/valor_referencia/obtener_valores_referencia_analisis.php',
            type: 'POST',
            data: {
                codigo_practica: analisis.codigo_practica
            },
            dataType: 'json',
            success: function(valores) {
                if (valores.length === 0) {
                    // Si no hay valores de referencia, mostrar un formulario genérico
                    let formGenerico = `
                        <div class="alert alert-info">
                            No hay valores de referencia definidos para este análisis.
                        </div>
                        <div class="form-group">
                            <label for="resultado_${analisis.codigo_practica}">Resultado:</label>
                            <input type="text" class="form-control" id="resultado_${analisis.codigo_practica}" placeholder="Ingrese el resultado">
                        </div>
                        <div class="form-group">
                            <label for="unidad_${analisis.codigo_practica}">Unidad:</label>
                            <input type="text" class="form-control" id="unidad_${analisis.codigo_practica}" placeholder="Ingrese la unidad">
                        </div>
                        <div class="form-group">
                            <label for="observaciones_${analisis.codigo_practica}">Observaciones:</label>
                            <textarea class="form-control" id="observaciones_${analisis.codigo_practica}" rows="2" placeholder="Observaciones opcionales"></textarea>
                        </div>
                    `;
                    cuerpo.append(formGenerico);
                } else {
                    // Si hay valores de referencia, crear una tabla
                    let tabla = $('<table></table>').addClass('table table-bordered table-striped');
                    
                    // Cabecera de la tabla
                    let thead = $('<thead></thead>').append(
                        $('<tr></tr>')
                            .append($('<th></th>').text('Tipo de Persona'))
                            .append($('<th></th>').text('Rango de Referencia'))
                            .append($('<th></th>').text('Valor Hallado'))
                            .append($('<th></th>').text('Unidad'))
                    );
                    tabla.append(thead);
                    
                    // Cuerpo de la tabla
                    let tbody = $('<tbody></tbody>');
                    
                    valores.forEach(function(valor) {
                        let fila = $('<tr></tr>');
                        
                        // Tipo de persona
                        fila.append($('<td></td>').text(valor.tipo_persona));
                        
                        // Rango de referencia
                        let rango = valor.valor_inicial_de_rango + ' - ' + valor.valor_final_de_rango + ' ' + valor.unidad;
                        fila.append($('<td></td>').text(rango));
                        
                        // Valor hallado (input)
                        let tdValor = $('<td></td>');
                        let inputValor = $('<input>')
                            .attr('type', 'number')
                            .attr('step', '0.01')
                            .addClass('form-control')
                            .attr('id', `valor_${analisis.codigo_practica}_${valor.id_valor_ref}`)
                            .attr('data-id-valor-ref', valor.id_valor_ref);
                        tdValor.append(inputValor);
                        fila.append(tdValor);
                        
                        // Unidad (select)
                        let tdUnidad = $('<td></td>');
                        let selectUnidad = $('<select></select>')
                            .addClass('form-control')
                            .attr('id', `unidad_${analisis.codigo_practica}_${valor.id_valor_ref}`)
                            .attr('data-id-valor-ref', valor.id_valor_ref);
                        
                        // Opción por defecto (la unidad del valor de referencia)
                        selectUnidad.append(
                            $('<option></option>')
                                .attr('value', valor.unidad)
                                .text(valor.unidad)
                        );
                        
                        // Otras unidades comunes (opcional)
                        ['mg/dL', 'g/L', 'mmol/L', 'U/L', 'mEq/L', '%'].forEach(function(unidad) {
                            if (unidad !== valor.unidad) {
                                selectUnidad.append(
                                    $('<option></option>')
                                        .attr('value', unidad)
                                        .text(unidad)
                                );
                            }
                        });
                        
                        tdUnidad.append(selectUnidad);
                        fila.append(tdUnidad);
                        
                        tbody.append(fila);
                    });
                    
                    tabla.append(tbody);
                    cuerpo.append(tabla);
                    
                    // Campo para observaciones
                    let observaciones = `
                        <div class="form-group mt-3">
                            <label for="observaciones_${analisis.codigo_practica}">Observaciones:</label>
                            <textarea class="form-control" id="observaciones_${analisis.codigo_practica}" rows="2" placeholder="Observaciones opcionales"></textarea>
                        </div>
                    `;
                    cuerpo.append(observaciones);
                }
                
                // Botones de acción
                let botonesAccion = `
                    <div class="text-right mt-3">
                        <button type="button" class="btn btn-primary" onclick="guardarResultado(${analisis.codigo_practica})">
                            <i class="fas fa-save"></i> Guardar Resultado
                        </button>
                        <button type="button" class="btn btn-warning ml-2" onclick="marcarSinResultado(${analisis.codigo_practica})">
                            <i class="fas fa-check"></i> Marcar Como Realizado (Sin Resultado)
                        </button>
                    </div>
                `;
                cuerpo.append(botonesAccion);
                
                // Añadir cabecera y cuerpo al contenedor
                contenedor.append(cabecera).append(cuerpo);
                
                // Añadir el contenedor al contenedor principal
                $('#contenedor_analisis').append(contenedor);
            },
            error: function() {
                // En caso de error, mostrar un mensaje
                let mensajeError = `
                    <div class="alert alert-danger">
                        No se pudieron cargar los valores de referencia para este análisis.
                    </div>
                `;
                cuerpo.append(mensajeError);
                
                // Añadir cabecera y cuerpo al contenedor
                contenedor.append(cabecera).append(cuerpo);
                
                // Añadir el contenedor al contenedor principal
                $('#contenedor_analisis').append(contenedor);
            }
        });
    }
    
    /**
     * Guarda el resultado de un análisis específico
     * @param {int} codigo_practica Código de la práctica
     */
    function guardarResultado(codigo_practica) {
        // Encontrar todos los inputs de valores y unidades para este análisis
        let container = $(`#analisis_${codigo_practica}`);
        let valores = [];
        
        // Recopilar valores hallados para los valores de referencia
        container.find('input[id^="valor_"][data-id-valor-ref]').each(function() {
            let id_valor_ref = $(this).data('id-valor-ref');
            let valor_hallado = $(this).val();
            let unidad = $(`#unidad_${codigo_practica}_${id_valor_ref}`).val();
            
            if (valor_hallado) {
                valores.push({
                    id_valor_ref: id_valor_ref,
                    valor_hallado: valor_hallado,
                    unidad: unidad
                });
            }
        });
        
        // Si hay un resultado genérico (sin valores de referencia)
        let resultado_generico = $(`#resultado_${codigo_practica}`).val();
        let unidad_generica = $(`#unidad_${codigo_practica}`).val();
        
        if (resultado_generico) {
            valores.push({
                id_valor_ref: 0, // Valor especial para indicar que es genérico
                valor_hallado: resultado_generico,
                unidad: unidad_generica
            });
        }
        
        // Observaciones
        let observaciones = $(`#observaciones_${codigo_practica}`).val();
        
        // Validar que haya al menos un valor
        if (valores.length === 0) {
            Swal.fire({
                title: 'Advertencia',
                text: 'Debe ingresar al menos un valor para guardar el resultado',
                icon: 'warning'
            });
            return;
        }
        
        // Enviar datos al servidor
        $.ajax({
            url: '../../controller/orden/guardar_resultado_analisis.php',
            type: 'POST',
            data: {
                id_orden: id_orden,
                codigo_practica: codigo_practica,
                valores: JSON.stringify(valores),
                observaciones: observaciones
            },
            dataType: 'json',
            success: function(response) {
                if (response.status === 'success') {
                    Swal.fire({
                        title: 'Éxito',
                        text: 'Resultado guardado correctamente',
                        icon: 'success'
                    }).then(() => {
                        // Actualizar la interfaz (opcional)
                        $(`#analisis_${codigo_practica}`).removeClass('card-primary').addClass('card-success');
                        
                        // Desactivar los controles
                        $(`#analisis_${codigo_practica} input, #analisis_${codigo_practica} select, #analisis_${codigo_practica} textarea`)
                            .prop('disabled', true);
                        
                        // Desactivar los botones
                        $(`#analisis_${codigo_practica} button`).prop('disabled', true);
                        
                        // Marcar como completado
                        $(`#analisis_${codigo_practica} .card-header`)
                            .append('<span class="badge badge-success float-right">Completado</span>');
                    });
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: response.message || 'Error al guardar el resultado',
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
    
    /**
     * Marca un análisis como realizado sin registrar resultados
     * @param {int} codigo_practica Código de la práctica
     */
    function marcarSinResultado(codigo_practica) {
        Swal.fire({
            title: '¿Marcar como realizado?',
            text: "¿Está seguro de marcar este análisis como realizado sin registrar resultados?",
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
                        if (response.status === 'success') {
                            Swal.fire({
                                title: 'Éxito',
                                text: 'Análisis marcado como realizado correctamente',
                                icon: 'success'
                            }).then(() => {
                                // Actualizar la interfaz
                                $(`#analisis_${codigo_practica}`).removeClass('card-primary').addClass('card-warning');
                                
                                // Desactivar los controles
                                $(`#analisis_${codigo_practica} input, #analisis_${codigo_practica} select, #analisis_${codigo_practica} textarea`)
                                    .prop('disabled', true);
                                
                                // Desactivar los botones
                                $(`#analisis_${codigo_practica} button`).prop('disabled', true);
                                
                                // Marcar como completado sin resultados
                                $(`#analisis_${codigo_practica} .card-header`)
                                    .append('<span class="badge badge-warning float-right">Realizado sin resultados</span>');
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
    
    /**
     * Guarda todos los resultados pendientes
     */
    function guardarTodosLosResultados() {
        // Verificar si hay análisis pendientes
        if ($('#contenedor_analisis .card').length === 0) {
            Swal.fire({
                title: 'Advertencia',
                text: 'No hay análisis pendientes para guardar',
                icon: 'warning'
            });
            return;
        }
        
        // Preguntar al usuario
        Swal.fire({
            title: '¿Guardar todos los resultados?',
            text: "Se guardarán todos los resultados ingresados y se marcarán los análisis como realizados",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, guardar todo',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Guardar cada análisis que tenga valores
                let promesas = [];
                let analisisSinValores = [];
                
                $('#contenedor_analisis .card').each(function() {
                    let codigo_practica = $(this).attr('id').replace('analisis_', '');
                    
                    // Verificar si el análisis ya está procesado (tiene botones desactivados)
                    if ($(this).find('button').prop('disabled')) {
                        return; // Continuar con el siguiente
                    }
                    
                    // Encontrar todos los inputs de valores para este análisis
                    let tieneValores = false;
                    
                    // Valores de referencia
                    $(this).find('input[id^="valor_"][data-id-valor-ref]').each(function() {
                        if ($(this).val()) {
                            tieneValores = true;
                            return false; // Salir del bucle
                        }
                    });
                    
                    // Resultado genérico
                    if (!tieneValores && $(this).find(`#resultado_${codigo_practica}`).val()) {
                        tieneValores = true;
                    }
                    
                    if (tieneValores) {
                        // Simular un clic en el botón de guardar para este análisis
                        promesas.push(new Promise(resolve => {
                            guardarResultado(codigo_practica);
                            // Dar tiempo para que la operación se complete
                            setTimeout(resolve, 1000);
                        }));
                    } else {
                        analisisSinValores.push(codigo_practica);
                    }
                });
                
                // Esperar a que se completen todas las operaciones de guardado
                Promise.all(promesas).then(() => {
                    // Preguntar si quiere marcar como realizados los análisis sin valores
                    if (analisisSinValores.length > 0) {
                        Swal.fire({
                            title: 'Análisis sin valores',
                            text: `Hay ${analisisSinValores.length} análisis sin valores ingresados. ¿Desea marcarlos como realizados sin resultados?`,
                            icon: 'question',
                            showCancelButton: true,
                            confirmButtonColor: '#3085d6',
                            cancelButtonColor: '#d33',
                            confirmButtonText: 'Sí, marcarlos',
                            cancelButtonText: 'No, dejarlos pendientes'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                let promesasMarcar = [];
                                
                                analisisSinValores.forEach(codigo_practica => {
                                    promesasMarcar.push(new Promise(resolve => {
                                        marcarSinResultado(codigo_practica);
                                        // Dar tiempo para que la operación se complete
                                        setTimeout(resolve, 1000);
                                    }));
                                });
                                
                                Promise.all(promesasMarcar).then(() => {
                                    finalizarProceso();
                                });
                            } else {
                                finalizarProceso();
                            }
                        });
                    } else {
                        finalizarProceso();
                    }
                });
            }
        });
    }
    
    /**
     * Finaliza el proceso de guardado y ofrece opciones
     */
    function finalizarProceso() {
        Swal.fire({
            title: 'Proceso completado',
            text: 'Todos los resultados han sido procesados',
            icon: 'success',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#28a745',
            confirmButtonText: 'Volver a la lista',
            cancelButtonText: 'Generar reporte'
        }).then((result) => {
            if (result.isConfirmed) {
                // Volver a la lista de órdenes pendientes
                window.location.href = 'pendientes.php';
            } else {
                // Generar reporte
                window.open('../../controller/orden/generar_reporte.php?id=' + id_orden, '_blank');
            }
        });
    }
</script>

<?php
require_once '../plantilla/pie.php';
?>