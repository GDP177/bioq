</div><!-- /.container-fluid -->
    </section>
    <!-- /.content -->
</div>
<!-- /.content-wrapper -->

<!-- Footer -->
<footer class="main-footer">
    <strong>Copyright &copy; 2023-<?php echo date('Y'); ?> <a href="#">Sistema de Laboratorio Bioquímico</a>.</strong>
    Todos los derechos reservados.
    <div class="float-right d-none d-sm-inline-block">
        <b>Versión</b> 1.0.0
    </div>
</footer>

<!-- Modal para cambiar contraseña -->
<div class="modal fade" id="modal_cambiar_password" tabindex="-1" role="dialog" aria-labelledby="modalPasswordLabel" aria-hidden="true">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header bg-primary">
                <h5 class="modal-title" id="modalPasswordLabel">Cambiar Contraseña</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <form id="form_cambiar_password">
                    <div class="form-group">
                        <label for="txt_password_actual">Contraseña Actual</label>
                        <input type="password" class="form-control" id="txt_password_actual" placeholder="Ingrese su contraseña actual">
                    </div>
                    <div class="form-group">
                        <label for="txt_password_nueva">Nueva Contraseña</label>
                        <input type="password" class="form-control" id="txt_password_nueva" placeholder="Ingrese nueva contraseña">
                    </div>
                    <div class="form-group">
                        <label for="txt_password_repetir">Repetir Contraseña</label>
                        <input type="password" class="form-control" id="txt_password_repetir" placeholder="Repita nueva contraseña">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-primary" onclick="cambiarPassword()">Guardar</button>
            </div>
        </div>
    </div>
</div>

</div>
<!-- ./wrapper -->

<!-- jQuery -->
<script src="../assets/js/jquery.min.js"></script>
<!-- jQuery UI -->
<script src="../assets/js/jquery-ui.min.js"></script>
<!-- Bootstrap 4 -->
<script src="../assets/js/bootstrap.bundle.min.js"></script>
<!-- DataTables -->
<script src="../assets/js/jquery.dataTables.min.js"></script>
<script src="../assets/js/dataTables.bootstrap4.min.js"></script>
<script src="../assets/js/dataTables.responsive.min.js"></script>
<script src="../assets/js/responsive.bootstrap4.min.js"></script>
<!-- Select2 -->
<script src="../assets/js/select2.full.min.js"></script>
<!-- AdminLTE App -->
<script src="../assets/js/adminlte.min.js"></script>
<!-- SweetAlert2 -->
<script src="../assets/js/sweetalert2.all.min.js"></script>
<!-- Custom scripts -->
<script src="../assets/js/app.js"></script>

<script>
    /**
     * Abre el modal para cambiar contraseña
     */
    function abrirModalCambiarPassword() {
        // Limpiar formulario
        $('#form_cambiar_password')[0].reset();
        
        // Mostrar modal
        $('#modal_cambiar_password').modal('show');
    }
    
    /**
     * Cambia la contraseña del usuario
     */
    function cambiarPassword() {
        // Obtener valores
        let password_actual = $('#txt_password_actual').val();
        let password_nueva = $('#txt_password_nueva').val();
        let password_repetir = $('#txt_password_repetir').val();
        
        // Validar campos
        if (password_actual.trim() === "" || password_nueva.trim() === "" || password_repetir.trim() === "") {
            Swal.fire({
                title: 'Advertencia',
                text: 'Todos los campos son obligatorios',
                icon: 'warning'
            });
            return;
        }
        
        // Validar que las contraseñas coincidan
        if (password_nueva !== password_repetir) {
            Swal.fire({
                title: 'Advertencia',
                text: 'Las contraseñas nuevas no coinciden',
                icon: 'warning'
            });
            return;
        }
        
        // Enviar solicitud AJAX
        $.ajax({
            url: '../controller/usuario/cambiar_password.php',
            type: 'POST',
            data: {
                password_actual: password_actual,
                password_nueva: password_nueva
            },
            dataType: 'json',
            success: function(response) {
                if (response.status === 'success') {
                    Swal.fire({
                        title: 'Éxito',
                        text: 'Contraseña cambiada correctamente',
                        icon: 'success'
                    }).then(function() {
                        // Cerrar modal
                        $('#modal_cambiar_password').modal('hide');
                    });
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: response.message,
                        icon: 'error'
                    });
                }
            },
            error: function() {
                Swal.fire({
                    title: 'Error',
                    text: 'Ocurrió un error al cambiar la contraseña',
                    icon: 'error'
                });
            }
        });
    }
</script>

</body>
</html>
