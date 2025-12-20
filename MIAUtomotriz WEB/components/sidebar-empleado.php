<?php
// Verificar que las variables de sesión estén disponibles
if (!isset($_SESSION)) {
    session_start();
}

$nombre_usuario = $_SESSION['usuario'] ?? 'Empleado';
$rut_usuario = $_SESSION['rut'] ?? '';
$tipo_usuario = $_SESSION['tipo_persona'] ?? 'Empleado';
?>
<nav class="sidebar empleado-sidebar">
    <div class="sidebar-header">
        <div class="logo">
            <i class="fas fa-car-side"></i>
            <h2>MiAutomotriz</h2>
        </div>
        <div class="user-info">
            <div class="user-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="user-details">
                <span class="user-name"><?php echo htmlspecialchars($nombre_usuario); ?></span>
                <span class="user-role">Técnico - Taller</span>
                <small class="user-rut"><?php echo htmlspecialchars($rut_usuario); ?></small>
            </div>
        </div>
    </div>

    <ul class="sidebar-menu">
        <li class="menu-item <?php echo basename($_SERVER['PHP_SELF']) == 'empleado_dashboard.php' ? 'active' : ''; ?>">
            <a href="empleado_dashboard.php">
                <i class="fas fa-tachometer-alt"></i>
                <span>Dashboard</span>
            </a>
        </li>
        <li class="menu-item <?php echo basename($_SERVER['PHP_SELF']) == 'gestion-tareas.php' ? 'active' : ''; ?>">
            <a href="gestion-tareas.php">
                <i class="fas fa-tasks"></i>
                <span>Mis Tareas</span>
            </a>
        </li>
        <li class="menu-item <?php echo basename($_SERVER['PHP_SELF']) == 'agenda-empleado.php' ? 'active' : ''; ?>">
            <a href="agenda-empleado.php">
                <i class="fas fa-calendar-alt"></i>
                <span>Agenda</span>
            </a>
        </li>
        <li class="menu-item">
            <a href="#">
                <i class="fas fa-car"></i>
                <span>Vehículos</span>
            </a>
        </li>
        <li class="menu-item">
            <a href="#">
                <i class="fas fa-clipboard-list"></i>
                <span>Checklists</span>
            </a>
        </li>
        <li class="menu-item">
            <a href="#">
                <i class="fas fa-history"></i>
                <span>Historial</span>
            </a>
        </li>
        <li class="menu-item">
            <a href="#">
                <i class="fas fa-toolbox"></i>
                <span>Inventario</span>
            </a>
        </li>
        <li class="menu-item">
            <a href="#">
                <i class="fas fa-file-invoice"></i>
                <span>Reportes</span>
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