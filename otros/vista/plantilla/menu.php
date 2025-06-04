<!-- Main Sidebar Container -->
<aside class="main-sidebar sidebar-dark-primary elevation-4">
    <!-- Brand Logo -->
    <a href="../index.php" class="brand-link">
        <img src="../assets/img/logo.png" alt="Logo" class="brand-image img-circle elevation-3" style="opacity: .8">
        <span class="brand-text font-weight-light">Lab Bioquímico</span>
    </a>

    <!-- Sidebar -->
    <div class="sidebar">
        <!-- Sidebar user panel (optional) -->
        <div class="user-panel mt-3 pb-3 mb-3 d-flex">
            <div class="image">
                <img src="../assets/img/user.png" class="img-circle elevation-2" alt="User Image">
            </div>
            <div class="info">
                <a href="#" class="d-block"><?php echo $_SESSION['S_USUARIO']; ?></a>
            </div>
        </div>

        <!-- Sidebar Menu -->
        <nav class="mt-2">
            <ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
                <!-- Dashboard -->
                <li class="nav-item">
                    <a href="../index.php" class="nav-link">
                        <i class="nav-icon fas fa-tachometer-alt"></i>
                        <p>Dashboard</p>
                    </a>
                </li>
                
                <!-- Módulo de Pacientes -->
                <li class="nav-item">
                    <a href="../vista/paciente/index.php" class="nav-link">
                        <i class="nav-icon fas fa-user-injured"></i>
                        <p>Pacientes</p>
                    </a>
                </li>
                
                <!-- Módulo de Médicos -->
                <li class="nav-item">
                    <a href="../vista/medico/index.php" class="nav-link">
                        <i class="nav-icon fas fa-user-md"></i>
                        <p>Médicos</p>
                    </a>
                </li>
                
                <!-- Módulo de Bioquímicos -->
                <li class="nav-item">
                    <a href="../vista/bioquimico/index.php" class="nav-link">
                        <i class="nav-icon fas fa-flask"></i>
                        <p>Bioquímicos</p>
                    </a>
                </li>
                
                <!-- Módulo de Análisis -->
                <li class="nav-item">
                    <a href="#" class="nav-link">
                        <i class="nav-icon fas fa-vial"></i>
                        <p>
                            Análisis
                            <i class="fas fa-angle-left right"></i>
                        </p>
                    </a>
                    <ul class="nav nav-treeview">
                        <li class="nav-item">
                            <a href="../vista/analisis/index.php" class="nav-link">
                                <i class="far fa-circle nav-icon"></i>
                                <p>Gestión de Análisis</p>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="../vista/valor_referencia/index.php" class="nav-link">
                                <i class="far fa-circle nav-icon"></i>
                                <p>Valores de Referencia</p>
                            </a>
                        </li>
                    </ul>
                </li>
                
                <!-- Módulo de Órdenes -->
                <li class="nav-item">
                    <a href="#" class="nav-link">
                        <i class="nav-icon fas fa-clipboard-list"></i>
                        <p>
                            Órdenes
                            <i class="fas fa-angle-left right"></i>
                        </p>
                    </a>
                    <ul class="nav nav-treeview">
                        <li class="nav-item">
                            <a href="../vista/orden/index.php" class="nav-link">
                                <i class="far fa-circle nav-icon"></i>
                                <p>Gestión de Órdenes</p>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="../vista/orden/pendientes.php" class="nav-link">
                                <i class="far fa-circle nav-icon"></i>
                                <p>Órdenes Pendientes</p>
                            </a>
                        </li>
                    </ul>
                </li>
                
                <!-- Módulo de Reportes -->
                <li class="nav-item">
                    <a href="#" class="nav-link">
                        <i class="nav-icon fas fa-chart-pie"></i>
                        <p>
                            Reportes
                            <i class="fas fa-angle-left right"></i>
                        </p>
                    </a>
                    <ul class="nav nav-treeview">
                        <li class="nav-item">
                            <a href="../vista/reportes/ordenes_por_fecha.php" class="nav-link">
                                <i class="far fa-circle nav-icon"></i>
                                <p>Órdenes por Fecha</p>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="../vista/reportes/analisis_realizados.php" class="nav-link">
                                <i class="far fa-circle nav-icon"></i>
                                <p>Análisis Realizados</p>
                            </a>
                        </li>
                    </ul>
                </li>
                
                <?php if ($_SESSION['S_ROL'] === 'administrador'): ?>
                <!-- Módulo de Administración (solo para administradores) -->
                <li class="nav-item">
                    <a href="#" class="nav-link">
                        <i class="nav-icon fas fa-cogs"></i>
                        <p>
                            Administración
                            <i class="fas fa-angle-left right"></i>
                        </p>
                    </a>
                    <ul class="nav nav-treeview">
                        <li class="nav-item">
                            <a href="../vista/usuario/index.php" class="nav-link">
                                <i class="far fa-circle nav-icon"></i>
                                <p>Usuarios</p>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="../vista/configuracion/index.php" class="nav-link">
                                <i class="far fa-circle nav-icon"></i>
                                <p>Configuración</p>
                            </a>
                        </li>
                    </ul>
                </li>
                <?php endif; ?>
            </ul>
        </nav>
        <!-- /.sidebar-menu -->
    </div>
    <!-- /.sidebar -->
</aside>

<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
    <!-- Content Header (Page header) -->
    <div class="content-header">
        <div class="container-fluid">
            <div class="row mb-2">
                <div class="col-sm-6">
                    <h1 class="m-0" id="titulo_principal"></h1>
                </div><!-- /.col -->
                <div class="col-sm-6">
                    <ol class="breadcrumb float-sm-right">
                        <li class="breadcrumb-item"><a href="../index.php">Inicio</a></li>
                        <li class="breadcrumb-item active" id="breadcrumb_pagina"></li>
                    </ol>
                </div><!-- /.col -->
            </div><!-- /.row -->
        </div><!-- /.container-fluid -->
    </div>
    <!-- /.content-header -->

    <!-- Main content -->
    <section class="content">
        <div class="container-fluid">
