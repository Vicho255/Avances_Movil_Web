    <?php
    session_start();

    // VERIFICACIÓN DE SESIÓN - Esto es CRÍTICO
    if(!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== TRUE){
        // No está autenticado, redirigir al login
        header('Location: login.php');
        exit();
    }

    // Verificar que sea administrador
    if($_SESSION['tipo_persona'] !== 'Administrador'){
        // No es administrador, redirigir
        header('Location: login.php');
        exit();
    }

    // Obtener datos del usuario de la sesión
    $nombre_usuario = $_SESSION['usuario'] ?? 'Administrador';
    $rut_usuario = $_SESSION['rut'] ?? '';

    // Configurar header
    $pageTitle = 'Dashboard Principal';
    $notificationCount = 3; // Puedes calcular esto dinámicamente
    ?>
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dashboard - Administrador - MiAutomotriz</title>
        <link rel="stylesheet" href="styles/layout.css">
        <link rel="stylesheet" href="styles/dashboardAdmin.css">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    </head>
    <body>
        <!-- Sidebar Navigation -->
        <?php include 'components/sidebar-admin.php'; ?>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Header -->
            <?php include 'components/header-admin.php'; ?>
            
            <!-- Stats Cards - Ahora con datos dinámicos -->
            <section class="stats-section">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="totalClientes">Cargando...</h3>
                            <p>Clientes Activos</p>
                        </div>
                        <div class="stat-trend up">
                            <i class="fas fa-arrow-up"></i>
                            <span>12%</span>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-car"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="totalVehiculos">Cargando...</h3>
                            <p>Vehículos Registrados</p>
                        </div>
                        <div class="stat-trend up">
                            <i class="fas fa-arrow-up"></i>
                            <span>8%</span>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-tools"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="totalServicios">Cargando...</h3>
                            <p>Servicios Hoy</p>
                        </div>
                        <div class="stat-trend down">
                            <i class="fas fa-arrow-down"></i>
                            <span>5%</span>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-dollar-sign"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="totalIngresos">Cargando...</h3>
                            <p>Ingresos del Mes</p>
                        </div>
                        <div class="stat-trend up">
                            <i class="fas fa-arrow-up"></i>
                            <span>15%</span>
                        </div>
                    </div>
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
                        <a href="nuevo_cliente.php" class="action-btn">
                            <i class="fas fa-user-plus"></i>
                            <span>Nuevo Cliente</span>
                        </a>
                        <a href="agendar_cita.php" class="action-btn">
                            <i class="fas fa-calendar-plus"></i>
                            <span>Agendar Cita</span>
                        </a>
                        <a href="generar_factura.php" class="action-btn">
                            <i class="fas fa-file-invoice"></i>
                            <span>Generar Factura</span>
                        </a>
                        <a href="reportes.php" class="action-btn">
                            <i class="fas fa-chart-pie"></i>
                            <span>Ver Reportes</span>
                        </a>
                        <a href="servicios.php" class="action-btn">
                            <i class="fas fa-tools"></i>
                            <span>Gestionar Servicios</span>
                        </a>
                        <a href="configuracion.php" class="action-btn">
                            <i class="fas fa-cog"></i>
                            <span>Configuración</span>
                        </a>
                    </div>
                </div>

                <!-- Recent Activities -->
                <div class="activities-card">
                    <div class="card-header">
                        <h3>Actividad Reciente</h3>
                        <button class="view-all">Ver Todo</button>
                    </div>
                    <div class="activities-list">
                        <div class="activity-item">
                            <div class="activity-icon success">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="activity-content">
                                <p>Bienvenido al sistema</p>
                                <span><?php echo date('H:i'); ?> - Hoy</span>
                            </div>
                        </div>
                        <div class="activity-item">
                            <div class="activity-icon info">
                                <i class="fas fa-user-check"></i>
                            </div>
                            <div class="activity-content">
                                <p>Sesión iniciada como <?php echo htmlspecialchars($nombre_usuario); ?></p>
                                <span>Usuario: <?php echo htmlspecialchars($rut_usuario); ?></span>
                            </div>
                        </div>
                        <div class="activity-item">
                            <div class="activity-icon primary">
                                <i class="fas fa-database"></i>
                            </div>
                            <div class="activity-content">
                                <p>Conectado a PostgreSQL</p>
                                <span>Base de datos: postgres</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Service Status -->
                <div class="status-card">
                    <div class="card-header">
                        <h3>Estado del Sistema</h3>
                    </div>
                    <div class="status-grid">
                        <div class="status-item">
                            <div class="status-indicator completed"></div>
                            <span>Sesión</span>
                            <strong>Activa</strong>
                        </div>
                        <div class="status-item">
                            <div class="status-indicator completed"></div>
                            <span>Base de datos</span>
                            <strong>Online</strong>
                        </div>
                        <div class="status-item">
                            <div class="status-indicator completed"></div>
                            <span>Autenticación</span>
                            <strong>OK</strong>
                        </div>
                        <div class="status-item">
                            <div class="status-indicator pending"></div>
                            <span>Modulos</span>
                            <strong>7/10</strong>
                        </div>
                    </div>
                </div>
            </section>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="components/theme-manager.js"></script>
        <script src="scripts/dashboard-admin.js"></script>
        
        <script>
            // Inicializar funcionalidades específicas
            document.addEventListener('DOMContentLoaded', function() {
                // Toggle sidebar en móvil
                const menuToggle = document.querySelector('.menu-toggle');
                const sidebar = document.querySelector('.sidebar');
                
                if (menuToggle && sidebar) {
                    menuToggle.addEventListener('click', () => {
                        sidebar.classList.toggle('active');
                    });
                }
            });

            // Actualizar hora en tiempo real
            function actualizarHora() {
                const ahora = new Date();
                const opciones = { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                };
                document.getElementById('currentDateTime').textContent = 
                    ahora.toLocaleDateString('es-ES', opciones);
            }
            
            // Actualizar cada segundo
            setInterval(actualizarHora, 1000);
            actualizarHora();
            
            // Simular carga de estadísticas
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(() => {
                    document.getElementById('totalClientes').textContent = '1,248';
                    document.getElementById('totalVehiculos').textContent = '856';
                    document.getElementById('totalServicios').textContent = '324';
                    document.getElementById('totalIngresos').textContent = '$45,670';
                }, 1000);
                
                // Mostrar información de sesión en consola para debug
                console.log('Sesión activa:', {
                    usuario: '<?php echo $_SESSION['usuario'] ?? ''; ?>',
                    tipo: '<?php echo $_SESSION['tipo_persona'] ?? ''; ?>',
                    rut: '<?php echo $_SESSION['rut'] ?? ''; ?>',
                    session_id: '<?php echo session_id(); ?>'
                });
            });
            
            // Verificar sesión periódicamente
            setInterval(function() {
                fetch('check_session.php')
                    .then(response => response.json())
                    .then(data => {
                        if (!data.authenticated) {
                            window.location.href = 'login.php';
                        }
                    })
                    .catch(() => {
                        console.log('Error verificando sesión');
                    });
            }, 300000); // Cada 5 minutos
        </script>
        
    </body>
    </html>