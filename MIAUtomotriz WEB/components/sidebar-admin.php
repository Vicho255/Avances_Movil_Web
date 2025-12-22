<?php
// Verificar que las variables de sesión estén disponibles
if (!isset($_SESSION)) {
    session_start();
}

$nombre_usuario = $_SESSION['usuario'] ?? 'Administrador';
$rut_usuario = $_SESSION['rut'] ?? '';
$tipo_usuario = $_SESSION['tipo_persona'] ?? 'Administrador';
?>
<nav class="sidebar admin-sidebar">
    <div class="sidebar-header">
        <div class="logo">
            <svg width="40" height="40" viewbox="0 0 24 24" fill="#ffffff">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
            <h2>MiAutomotriz</h2>
        </div>
        <div class="user-info">
            <div class="user-avatar">
                <i class="fas fa-user-shield"></i>
            </div>
            <div class="user-details">
                <span class="user-name"><?php echo htmlspecialchars($nombre_usuario); ?></span>
                <span class="user-role">Administrador</span>
                <small class="user-rut"><?php echo htmlspecialchars($rut_usuario); ?></small>
            </div>
        </div>
    </div>

    <ul class="sidebar-menu">
        <li class="menu-item <?php echo basename($_SERVER['PHP_SELF']) == 'admin_dashboard.php' ? 'active' : ''; ?>">
            <a href="admin_dashboard.php">
                <i class="fas fa-tachometer-alt"></i>
                <span>Dashboard</span>
            </a>
        </li>
        <li class="menu-item <?php echo basename($_SERVER['PHP_SELF']) == 'gestion-clientes.php' ? 'active' : ''; ?>">
            <a href="gestion-clientes.php">
                <i class="fas fa-users"></i>
                <span>Clientes</span>
            </a>
        </li>
        <li class="menu-item <?php echo basename($_SERVER['PHP_SELF']) == 'gestion-empleado.php' ? 'active' : ''; ?>">
            <a href="gestion-empleado.php">
                <i class="fas fa-user-tie"></i>
                <span>Empleados</span>
            </a>
        </li>
        <li class="menu-item <?php echo basename($_SERVER['PHP_SELF']) == 'gestion-vehiculos.php' ? 'active' : ''; ?>">
            <a href="gestion-vehiculos.php">
                <i class="fas fa-car"></i>
                <span>Vehículos</span>
            </a>
        </li>
        <li class="menu-item <?php echo basename($_SERVER['PHP_SELF']) == 'gestion-servicios.php' ? 'active' : ''; ?>">
            <a href="gestion-servicios.php">
                <i class="fas fa-tools"></i>
                <span>Servicios</span>
            </a>
        </li>
        <li class="menu-item <?php echo basename($_SERVER['PHP_SELF']) == 'gestion-facturas.php' ? 'active' : ''; ?>">
            <a href="gestion-facturas.php">
                <i class="fas fa-file-invoice-dollar"></i>
                <span>Facturación</span>
            </a>
        </li>
        <li class="menu-item <?php echo basename($_SERVER['PHP_SELF']) == 'gestion-cotizaciones.php' ? 'active' : ''; ?>">
            <a href="gestion-cotizaciones.php">
                <i class="fas fa-file-alt"></i>
                <span>Cotización</span>
            </a>
        </li>
        <li class="menu-item">
            <a href="#">
                <i class="fas fa-chart-bar"></i>
                <span>Reportes</span>
            </a>
        </li>
        <li class="menu-item <?php echo basename($_SERVER['PHP_SELF']) == 'gestion-inventario.php' ? 'active' : ''; ?>">
            <a href="gestion-inventario.php">
                <i class="fas fa-boxes"></i>
                <span>Inventario</span>
            </a>
        </li>
        <li class="menu-item <?php echo basename($_SERVER['PHP_SELF']) == 'configuracion.php' ? 'active' : ''; ?>">
            <a href="configuracion.php">
                <i class="fas fa-cog"></i>
                <span>Configuración</span>
            </a>
        </li>
    </ul>

    <div class="sidebar-footer">
        <a href="logout.php" class="logout-btn">
            <i class="fas fa-sign-out-alt"></i>
            <span>Cerrar Sesión</span>
        </a>
    </div>
</nav>