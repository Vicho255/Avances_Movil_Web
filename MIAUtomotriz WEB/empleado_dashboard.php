<?php
session_start();

// VERIFICACIÓN DE SESIÓN
if(!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== TRUE){
    header('Location: login.php');
    exit();
}

// Verificar que sea empleado
if($_SESSION['tipo_persona'] !== 'Empleado'){
    header('Location: login.php');
    exit();
}

// Obtener datos del usuario de la sesión
$nombre_usuario = $_SESSION['usuario'] ?? 'Empleado';
$rut_usuario = $_SESSION['rut'] ?? '';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Empleado - MiAutomotriz</title>
    <link rel="stylesheet" href="styles/dashoboasrEmpleado.css">
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
            <li class="menu-item active">
                <a href="dashboardEmpleado.php">
                    <i class="fas fa-tachometer-alt"></i>
                    <span>Dashboard</span>
                </a>
            </li>
            <li class="menu-item">
                <a href="gestionTareasE.php">
                    <i class="fas fa-tasks"></i>
                    <span>Mis Tareas</span>
                </a>
            </li>
            <li class="menu-item">
                <a href="agendaE.php">
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

    <!-- Main Content -->
    <main class="main-content">
        <!-- Header -->
        <header class="top-header">
            <div class="header-left">
                <button class="menu-toggle">
                    <i class="fas fa-bars"></i>
                </button>
                <h1>Mi Panel de Trabajo</h1>
            </div>
            <div class="header-right">
                <div class="shift-info">
                    <i class="fas fa-clock"></i>
                    <span>Turno: 08:00 - 17:00</span>
                </div>
                <div class="header-actions">
                    <button class="notification-btn">
                        <i class="fas fa-bell"></i>
                        <span class="notification-badge">5</span>
                    </button>
                    <button class="break-btn" id="breakToggle">
                        <i class="fas fa-coffee"></i>
                        <span>En Turno</span>
                    </button>

                </div>
                <div class="current-time">
                    <span id="currentDateTime"><?php echo date('d/m/Y H:i:s'); ?></span>
                </div>
                    <button class="theme-toggle" id="themeToggle">
                        <i class="fas fa-moon"></i>
                        <i class="fas fa-sun"></i>
                    </button>
            </div>
        </header>

        <!-- Quick Stats -->
        <section class="quick-stats">
            <div class="stats-grid">
                <div class="quick-stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-play-circle"></i>
                    </div>
                    <div class="stat-content">
                        <h3>3</h3>
                        <p>En Progreso</p>
                    </div>
                </div>

                <div class="quick-stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-content">
                        <h3>5</h3>
                        <p>Pendientes</p>
                    </div>
                </div>

                <div class="quick-stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-content">
                        <h3>12</h3>
                        <p>Completados Hoy</p>
                    </div>
                </div>

                <div class="quick-stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-stopwatch"></i>
                    </div>
                    <div class="stat-content">
                        <h3>2.5h</h3>
                        <p>Tiempo Promedio</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Main Content Grid -->
        <section class="content-grid">
            <!-- Current Tasks -->
            <div class="tasks-card">
                <div class="card-header">
                    <h3>Tareas en Progreso</h3>
                    <button class="view-all">Ver Todas</button>
                </div>
                <div class="tasks-list">
                    <div class="task-item urgent">
                        <div class="task-info">
                            <div class="task-header">
                                <h4>Cambio de Frenos - Toyota Corolla</h4>
                                <span class="task-time">2:30h</span>
                            </div>
                            <p class="task-desc">ABC-123 • Juan González</p>
                            <div class="task-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: 75%"></div>
                                </div>
                                <span>75%</span>
                            </div>
                        </div>
                        <div class="task-actions">
                            <button class="task-btn pause">
                                <i class="fas fa-pause"></i>
                            </button>
                            <button class="task-btn complete">
                                <i class="fas fa-check"></i>
                            </button>
                        </div>
                    </div>

                    <div class="task-item">
                        <div class="task-info">
                            <div class="task-header">
                                <h4>Alineación y Balanceo - Honda Civic</h4>
                                <span class="task-time">1:15h</span>
                            </div>
                            <p class="task-desc">XYZ-789 • María López</p>
                            <div class="task-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: 40%"></div>
                                </div>
                                <span>40%</span>
                            </div>
                        </div>
                        <div class="task-actions">
                            <button class="task-btn pause">
                                <i class="fas fa-pause"></i>
                            </button>
                            <button class="task-btn complete">
                                <i class="fas fa-check"></i>
                            </button>
                        </div>
                    </div>

                    <div class="task-item">
                        <div class="task-info">
                            <div class="task-header">
                                <h4>Cambio de Aceite - Nissan Sentra</h4>
                                <span class="task-time">0:45h</span>
                            </div>
                            <p class="task-desc">DEF-456 • Carlos Ruiz</p>
                            <div class="task-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: 25%"></div>
                                </div>
                                <span>25%</span>
                            </div>
                        </div>
                        <div class="task-actions">
                            <button class="task-btn pause">
                                <i class="fas fa-pause"></i>
                            </button>
                            <button class="task-btn complete">
                                <i class="fas fa-check"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Today's Schedule -->
            <div class="schedule-card">
                <div class="card-header">
                    <h3>Agenda de Hoy</h3>
                    <div class="date-nav">
                        <button class="nav-btn">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <span id="todayDate"></span>
                        <button class="nav-btn">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
                <div class="schedule-timeline">
                    <div class="time-slot">
                        <div class="time-label">08:00</div>
                        <div class="schedule-item">
                            <div class="schedule-dot"></div>
                            <div class="schedule-content">
                                <strong>Inicio de Turno</strong>
                                <span>Registro de entrada</span>
                            </div>
                        </div>
                    </div>

                    <div class="time-slot">
                        <div class="time-label">09:00</div>
                        <div class="schedule-item appointment">
                            <div class="schedule-dot"></div>
                            <div class="schedule-content">
                                <strong>Revisión General - Ford Focus</strong>
                                <span>Cliente: Ana Martínez</span>
                                <span class="appointment-time">09:00 - 10:30</span>
                            </div>
                        </div>
                    </div>

                    <div class="time-slot">
                        <div class="time-label">11:00</div>
                        <div class="schedule-item break">
                            <div class="schedule-dot"></div>
                            <div class="schedule-content">
                                <strong>Descanso</strong>
                                <span>11:00 - 11:30</span>
                            </div>
                        </div>
                    </div>

                    <div class="time-slot">
                        <div class="time-label">13:00</div>
                        <div class="schedule-item appointment">
                            <div class="schedule-dot"></div>
                            <div class="schedule-content">
                                <strong>Cambio de Neumáticos - Chevrolet Aveo</strong>
                                <span>Cliente: Roberto Sánchez</span>
                                <span class="appointment-time">13:00 - 14:00</span>
                            </div>
                        </div>
                    </div>

                    <div class="time-slot">
                        <div class="time-label">15:00</div>
                        <div class="schedule-item">
                            <div class="schedule-dot"></div>
                            <div class="schedule-content">
                                <strong>Tiempo Disponible</strong>
                                <span>Tareas pendientes</span>
                            </div>
                        </div>
                    </div>

                    <div class="time-slot">
                        <div class="time-label">17:00</div>
                        <div class="schedule-item">
                            <div class="schedule-dot"></div>
                            <div class="schedule-content">
                                <strong>Fin de Turno</strong>
                                <span>Registro de salida</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="actions-card">
                <div class="card-header">
                    <h3>Acciones Rápidas</h3>
                </div>
                <div class="actions-grid">
                    <button class="action-btn">
                        <i class="fas fa-plus-circle"></i>
                        <span>Nueva Tarea</span>
                    </button>
                    <button class="action-btn">
                        <i class="fas fa-clipboard-check"></i>
                        <span>Checklist</span>
                    </button>
                    <button class="action-btn">
                        <i class="fas fa-tools"></i>
                        <span>Solicitar Repuestos</span>
                    </button>
                    <button class="action-btn">
                        <i class="fas fa-file-alt"></i>
                        <span>Reporte Diario</span>
                    </button>
                    <button class="action-btn">
                        <i class="fas fa-car-crash"></i>
                        <span>Reportar Problema</span>
                    </button>
                    <button class="action-btn">
                        <i class="fas fa-question-circle"></i>
                        <span>Soporte</span>
                    </button>
                </div>
            </div>

            <!-- Performance Metrics -->
            <div class="metrics-card">
                <div class="card-header">
                    <h3>Mi Rendimiento</h3>
                    <select class="metrics-filter">
                        <option>Esta Semana</option>
                        <option>Este Mes</option>
                        <option>Este Trimestre</option>
                    </select>
                </div>
                <div class="metrics-grid">
                    <div class="metric-item">
                        <div class="metric-value">94%</div>
                        <div class="metric-label">Eficiencia</div>
                        <div class="metric-trend up">
                            <i class="fas fa-arrow-up"></i>
                            <span>2%</span>
                        </div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value">2.3h</div>
                        <div class="metric-label">Tiempo Promedio</div>
                        <div class="metric-trend down">
                            <i class="fas fa-arrow-down"></i>
                            <span>0.2h</span>
                        </div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value">12</div>
                        <div class="metric-label">Tareas/Día</div>
                        <div class="metric-trend up">
                            <i class="fas fa-arrow-up"></i>
                            <span>1</span>
                        </div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value">0</div>
                        <div class="metric-label">Reclamos</div>
                        <div class="metric-trend neutral">
                            <i class="fas fa-minus"></i>
                            <span>0</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <script src="scripts/dashboasrEmpleado.js"></script>
    
    <script>
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
        
        // Mostrar información de sesión en consola para debug
        console.log('Sesión activa empleado:', {
            usuario: '<?php echo $_SESSION['usuario'] ?? ''; ?>',
            tipo: '<?php echo $_SESSION['tipo_persona'] ?? ''; ?>',
            rut: '<?php echo $_SESSION['rut'] ?? ''; ?>'
        });
    </script>

</body>
</html>