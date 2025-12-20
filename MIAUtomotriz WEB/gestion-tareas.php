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
    <link rel="stylesheet" href="styles/layout.css">
    <link rel="stylesheet" href="styles/gestion-tareas.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body>
    <!-- Sidebar Navigation -->
    <?php include 'components/sidebar-empleado.php'; ?>

    <!-- Main Content -->
    <main class="main-content">
        <!-- Header -->
        <?php include 'components/header-empleado.php'; ?>
        
        <!-- Dashboard de Tareas -->
        <div class="dashboard-tareas">
            <!-- Encabezado -->
            <div class="dashboard-header">
                <h1><i class="fas fa-tasks"></i> Gestión de Tareas</h1>
                <p>Bienvenido, <?php echo htmlspecialchars($nombre_usuario); ?>. Aquí puedes gestionar tus tareas asignadas.</p>
            </div>
                
            <!-- Estadísticas -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon urgent">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="urgent-count">0</h3>
                        <p>Tareas Urgentes</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon in-progress">
                        <i class="fas fa-tasks"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="progress-count">0</h3>
                        <p>En Progreso</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon completed">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="completed-count">0</h3>
                        <p>Completadas Hoy</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon pending">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="pending-count">0</h3>
                        <p>Pendientes</p>
                    </div>
                </div>
            </div>
            
            <!-- Sección Principal de Tareas -->
            <div class="tasks-section">
                <!-- Tareas en Progreso -->
                <div class="tasks-card">
                    <div class="card-header">
                        <h3><i class="fas fa-spinner"></i> Tareas en Progreso</h3>
                        <button class="view-all" onclick="verTodasTareas()">Ver Todas</button>
                    </div>
                    <div class="tasks-list" id="tareas-progreso-container">
                        <!-- Las tareas en progreso se cargarán aquí -->
                        <div class="empty-state" id="empty-progress">
                            <i class="fas fa-clipboard-list"></i>
                            <p>No hay tareas en progreso</p>
                        </div>
                    </div>
                </div>
                
                <!-- Sidebar de Filtros e Información -->
                <div class="sidebar-tasks">
                    <!-- Filtros -->
                    <div class="sidebar-card">
                        <h4><i class="fas fa-filter"></i> Filtros</h4>
                        <div class="filter-options">
                            <button class="filter-btn active" onclick="filtrarTareas('todas')">
                                <i class="fas fa-list"></i> Todas las tareas
                            </button>
                            <button class="filter-btn" onclick="filtrarTareas('urgentes')">
                                <i class="fas fa-exclamation-circle"></i> Urgentes
                            </button>
                            <button class="filter-btn" onclick="filtrarTareas('hoy')">
                                <i class="fas fa-calendar-day"></i> Para hoy
                            </button>
                            <button class="filter-btn" onclick="filtrarTareas('completadas')">
                                <i class="fas fa-check-circle"></i> Completadas
                            </button>
                        </div>
                    </div>
                    
                    <!-- Información Rápida -->
                    <div class="sidebar-card">
                        <h4><i class="fas fa-info-circle"></i> Información</h4>
                        <div style="font-size: 0.9rem; color: #6c757d;">
                            <p><i class="fas fa-user" style="color: #3498db; width: 20px;"></i> 
                               <strong>Empleado:</strong> <?php echo htmlspecialchars($nombre_usuario); ?></p>
                            <p><i class="fas fa-id-card" style="color: #3498db; width: 20px;"></i> 
                               <strong>RUT:</strong> <?php echo htmlspecialchars($rut_usuario); ?></p>
                            <p><i class="fas fa-calendar" style="color: #3498db; width: 20px;"></i> 
                               <strong>Fecha:</strong> <span id="current-date"></span></p>
                            <p><i class="fas fa-clock" style="color: #3498db; width: 20px;"></i> 
                               <strong>Hora:</strong> <span id="current-time"></span></p>
                        </div>
                    </div>
                    
                    <!-- Acciones Rápidas -->
                    <div class="sidebar-card">
                        <h4><i class="fas fa-bolt"></i> Acciones Rápidas</h4>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <button class="filter-btn" onclick="marcarTodasCompletadas()">
                                <i class="fas fa-check-double"></i> Marcar todas como completadas
                            </button>
                            <button class="filter-btn" onclick="exportarReporte()">
                                <i class="fas fa-download"></i> Exportar reporte
                            </button>
                            <button class="filter-btn" onclick="solicitarNuevasTareas()">
                                <i class="fas fa-plus-circle"></i> Solicitar nuevas tareas
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Tareas Completadas -->
            <div class="tasks-card completed-tasks">
                <div class="card-header">
                    <h3><i class="fas fa-check-circle"></i> Tareas Completadas Recientemente</h3>
                    <button class="view-all" onclick="verHistorialCompletadas()">Ver Historial</button>
                </div>
                <div class="tasks-list" id="tareas-completadas-container">
                    <!-- Las tareas completadas se cargarán aquí -->
                    <div class="empty-state" id="empty-completed">
                        <i class="fas fa-clipboard-check"></i>
                        <p>No hay tareas completadas recientemente</p>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Modal para Detalles de Tarea -->
    <div id="task-modal" class="modal" style="display: none;">
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3 id="modal-title">Detalles de Tarea</h3>
                <span class="close-modal" onclick="cerrarModal()">&times;</span>
            </div>
            <div class="modal-body" id="modal-body">
                <!-- Contenido dinámico -->
            </div>
        </div>
    </div>

    <script src="scripts/gestion-tareas.js"></script>
    <script>
        // Mostrar información de sesión en consola para debug
        console.log('Sesión activa empleado:', {
            usuario: '<?php echo $_SESSION['usuario'] ?? ''; ?>',
            tipo: '<?php echo $_SESSION['tipo_persona'] ?? ''; ?>',
            rut: '<?php echo $_SESSION['rut'] ?? ''; ?>'
        });
    </script>

</body>