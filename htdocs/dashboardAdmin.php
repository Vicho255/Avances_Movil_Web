<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Administrador - MiAutomotriz</title>
    <link rel="stylesheet" href="/styles/dashboardAdmin.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body>
    <!-- Sidebar Navigation -->
    <nav class="sidebar">
        <div class="sidebar-header">
            <div class="logo">
                <i class="fas fa-car-side"></i>
                <h2>MiAutomotriz</h2>
            </div>
            <div class="user-info">
                <div class="user-avatar">
                    <i class="fas fa-user-shield"></i>
                </div>
                <div class="user-details">
                    <span class="user-name">Admin Principal</span>
                    <span class="user-role">Administrador</span>
                </div>
            </div>
        </div>

        <ul class="sidebar-menu">
            <li class="menu-item active">
                <a href="dashboardAdmin.php">
                    <i class="fas fa-tachometer-alt"></i>
                    <span>Dashboard</span>
                </a>
            </li>
            <li class="menu-item">
                <a href="clientes.php">
                    <i class="fas fa-users"></i>
                    <span>Clientes</span>
                </a>
            </li>
            <li class="menu-item">
                <a href="gestionEmpleados.php">
                    <i class="fas fa-user-tie"></i>
                    <span>Empleados</span>
                </a>
            </li>
            <li class="menu-item">
                <a href="gestionVehiculos.php">
                    <i class="fas fa-car"></i>
                    <span>Vehículos</span>
                </a>
            </li>
            <li class="menu-item">
                <a href="#">
                    <i class="fas fa-tools"></i>
                    <span>Servicios</span>
                </a>
            </li>
            <li class="menu-item">
                <a href="#">
                    <i class="fas fa-file-invoice-dollar"></i>
                    <span>Facturación</span>
                </a>
            </li>
            <li class="menu-item">
                <a href="#">
                    <i class="fas fa-chart-bar"></i>
                    <span>Reportes</span>
                </a>
            </li>
            <li class="menu-item">
                <a href="#">
                    <i class="fas fa-cog"></i>
                    <span>Configuración</span>
                </a>
            </li>
        </ul>

        <div class="sidebar-footer">
            <a href="login.php" class="logout-btn">
                <i class="fas fa-sign-out-alt"></i>
                <span>Cerrar Sesión</span>
            </a>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
        <!-- Header -->
        <header class="top-header">
            <div class="header-left">
                <button class="menu-toggle">
                    <i class="fas fa-bars"></i>
                </button>
                <h1>Dashboard Principal</h1>
            </div>
            <div class="header-right">
                <div class="header-actions">
                    <button class="notification-btn">
                        <i class="fas fa-bell"></i>
                        <span class="notification-badge">3</span>
                    </button>
                    <button class="search-btn">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
                <div class="current-time">
                    <span id="currentDateTime">
                        <?php echo date('d/m/Y H:i:s'); ?>
                    </span>
                </div>
            </div>
        </header>
        
        <!-- Stats Cards -->
        <section class="stats-section">
            <div class="stats-grid">
                <?php
                // Ejemplo de datos dinámicos desde PHP
                $stats = [
                    ['icon' => 'fa-users', 'value' => '1,248', 'label' => 'Clientes Activos', 'trend' => 'up', 'percentage' => '12%'],
                    ['icon' => 'fa-car', 'value' => '856', 'label' => 'Vehículos Registrados', 'trend' => 'up', 'percentage' => '8%'],
                    ['icon' => 'fa-tools', 'value' => '324', 'label' => 'Servicios Hoy', 'trend' => 'down', 'percentage' => '5%'],
                    ['icon' => 'fa-dollar-sign', 'value' => '$45,670', 'label' => 'Ingresos del Mes', 'trend' => 'up', 'percentage' => '15%']
                ];
                
                foreach ($stats as $stat) {
                    echo '
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas ' . $stat['icon'] . '"></i>
                        </div>
                        <div class="stat-info">
                            <h3>' . $stat['value'] . '</h3>
                            <p>' . $stat['label'] . '</p>
                        </div>
                        <div class="stat-trend ' . $stat['trend'] . '">
                            <i class="fas fa-arrow-' . ($stat['trend'] == 'up' ? 'up' : 'down') . '"></i>
                            <span>' . $stat['percentage'] . '</span>
                        </div>
                    </div>';
                }
                ?>
            </div>
        </section>

        <!-- Charts and Main Content -->
        <section class="content-grid">
            <!-- Revenue Chart -->
            <div class="chart-card">
                <div class="card-header">
                    <h3>Ingresos Mensuales</h3>
                    <select class="chart-filter">
                        <option>Último año</option>
                        <option>Últimos 2 años</option>
                    </select>
                </div>
                <div class="chart-container">
                    <canvas id="revenueChart"></canvas>
                </div>
            </div>

            <!-- Clients Chart -->
            <div class="client-card">
                <div class="card-header">
                    <h3>Clientes Nuevos</h3>
                    <select class="chart-filter">
                        <option>Última Semana</option>
                        <option>Último Mes</option>
                    </select>
                </div>
                <div class="chart-container">
                    <canvas id="revenueChartCLI"></canvas>
                </div>
            </div>

            <!-- Repuestos Chart -->
            <div class="refills-card">
                <div class="card-header">
                    <h3>Repuestos Mas Usados</h3>
                </div>
                <div class="chart-container">
                    <canvas id="revenueChartRep"></canvas>
                </div>
            </div>

            <!-- Averias Chart -->
            <div class="faults-card">
                <div class="card-header">
                    <h3>Averias Mas Comunes</h3>
                </div>
                <div class="chart-container">
                    <canvas id="revenueChartFall"></canvas>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="actions-card">
                <div class="card-header">
                    <h3>Acciones Rápidas</h3>
                </div>
                <div class="actions-grid">
                    <?php
                    $quickActions = [
                        ['icon' => 'fa-user-plus', 'label' => 'Nuevo Cliente', 'link' => 'nuevo_cliente.php'],
                        ['icon' => 'fa-calendar-plus', 'label' => 'Agendar Cita', 'link' => 'agendar_cita.php'],
                        ['icon' => 'fa-file-invoice', 'label' => 'Generar Factura', 'link' => 'facturacion.php'],
                        ['icon' => 'fa-chart-pie', 'label' => 'Ver Reportes', 'link' => 'reportes.php'],
                        ['icon' => 'fa-tools', 'label' => 'Gestionar Servicios', 'link' => 'servicios.php'],
                        ['icon' => 'fa-cog', 'label' => 'Configuración', 'link' => 'configuracion.php']
                    ];
                    
                    foreach ($quickActions as $action) {
                        echo '<a href="' . $action['link'] . '" class="action-btn">
                                <i class="fas ' . $action['icon'] . '"></i>
                                <span>' . $action['label'] . '</span>
                              </a>';
                    }
                    ?>
                </div>
            </div>

            <!-- Recent Activities -->
            <div class="activities-card">
                <div class="card-header">
                    <h3>Actividad Reciente</h3>
                    <button class="view-all">Ver Todo</button>
                </div>
                <div class="activities-list">
                    <?php
                    // Ejemplo de actividades recientes (podrían venir de una base de datos)
                    $activities = [
                        ['icon' => 'fa-check-circle', 'type' => 'success', 'text' => 'Servicio completado - Cambio de aceite', 'time' => 'Hace 5 minutos'],
                        ['icon' => 'fa-exclamation-triangle', 'type' => 'warning', 'text' => 'Nuevo cliente registrado', 'time' => 'Hace 15 minutos'],
                        ['icon' => 'fa-info-circle', 'type' => 'info', 'text' => 'Cita agendada para mañana', 'time' => 'Hace 30 minutos'],
                        ['icon' => 'fa-car', 'type' => 'primary', 'text' => 'Vehículo nuevo agregado al inventario', 'time' => 'Hace 1 hora']
                    ];
                    
                    foreach ($activities as $activity) {
                        echo '
                        <div class="activity-item">
                            <div class="activity-icon ' . $activity['type'] . '">
                                <i class="fas ' . $activity['icon'] . '"></i>
                            </div>
                            <div class="activity-content">
                                <p>' . $activity['text'] . '</p>
                                <span>' . $activity['time'] . '</span>
                            </div>
                        </div>';
                    }
                    ?>
                </div>
            </div>

            <!-- Service Status -->
            <div class="status-card">
                <div class="card-header">
                    <h3>Estado de Servicios</h3>
                </div>
                <div class="status-grid">
                    <?php
                    $serviceStatus = [
                        ['status' => 'pending', 'label' => 'Pendientes', 'count' => 12],
                        ['status' => 'in-progress', 'label' => 'En Progreso', 'count' => 8],
                        ['status' => 'completed', 'label' => 'Completados', 'count' => 45],
                        ['status' => 'cancelled', 'label' => 'Cancelados', 'count' => 3]
                    ];
                    
                    foreach ($serviceStatus as $status) {
                        echo '
                        <div class="status-item">
                            <div class="status-indicator ' . $status['status'] . '"></div>
                            <span>' . $status['label'] . '</span>
                            <strong>' . $status['count'] . '</strong>
                        </div>';
                    }
                    ?>
                </div>
            </div>
        </section>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="/scripts/dashboard-admin.js"></script>
    <script>
        // Actualizar fecha y hora en tiempo real
        function updateDateTime() {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            };
            document.getElementById('currentDateTime').textContent = 
                now.toLocaleDateString('es-ES', options);
        }
        
        // Actualizar cada segundo
        setInterval(updateDateTime, 1000);
        updateDateTime(); // Llamada inicial
    </script>
</body>
</html>