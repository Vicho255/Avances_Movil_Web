<?php
// gestion-tareas.php - Archivo principal actualizado
session_start();

if(!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== TRUE){
    header('Location: login.php');
    exit();
}

if($_SESSION['tipo_persona'] !== 'Empleado'){
    header('Location: login.php');
    exit();
}

$nombre_usuario = $_SESSION['usuario'] ?? 'Empleado';
$rut_usuario = $_SESSION['rut'] ?? '';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestión de Tareas - Empleado - MiAutomotriz</title>
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
                <div class="dashboard-actions">
                    <button class="btn-refresh" onclick="location.reload()">
                        <i class="fas fa-redo"></i> Actualizar
                    </button>
                    <button class="btn-export" onclick="exportarReporteMensual()">
                        <i class="fas fa-download"></i> Exportar Reporte
                    </button>
                </div>
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
                <!-- Tareas Activas -->
                <div class="tasks-card">
                    <div class="card-header">
                        <h3><i class="fas fa-spinner"></i> Tareas Activas</h3>
                        <div class="card-actions">
                            <select id="filtro-estado" onchange="filtrarPorEstado(this.value)" class="select-estado">
                                <option value="todos">Todas</option>
                                <option value="urgente">Urgentes</option>
                                <option value="en-proceso">En Proceso</option>
                                <option value="pendiente">Pendientes</option>
                            </select>
                            <button class="view-all" onclick="verTodasTareas()">Ver Todas</button>
                        </div>
                    </div>
                    <div class="tasks-list" id="tareas-progreso-container">
                        <!-- Las tareas se cargarán dinámicamente -->
                        <div class="loading-tasks">
                            <div class="loading-spinner"></div>
                            <p>Cargando tareas...</p>
                        </div>
                    </div>
                </div>
                
                <!-- Sidebar de Información -->
                <div class="sidebar-tasks">
                    <!-- Información del Empleado -->
                    <div class="sidebar-card">
                        <h4><i class="fas fa-user"></i> Mi Información</h4>
                        <div class="empleado-info">
                            <div class="info-item">
                                <span class="info-label">Nombre:</span>
                                <span class="info-value"><?php echo htmlspecialchars($nombre_usuario); ?></span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">RUT:</span>
                                <span class="info-value"><?php echo htmlspecialchars($rut_usuario); ?></span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Fecha:</span>
                                <span class="info-value" id="current-date"></span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Hora:</span>
                                <span class="info-value" id="current-time"></span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Acciones Rápidas -->
                    <div class="sidebar-card">
                        <h4><i class="fas fa-bolt"></i> Acciones Rápidas</h4>
                        <div class="quick-actions">
                            <button class="action-btn" onclick="marcarTodasCompletadas()">
                                <i class="fas fa-check-double"></i>
                                <span>Marcar todas completadas</span>
                            </button>
                            <button class="action-btn" onclick="solicitarNuevasTareas()">
                                <i class="fas fa-plus-circle"></i>
                                <span>Solicitar más tareas</span>
                            </button>
                            <button class="action-btn" onclick="verHistorialCompletadas()">
                                <i class="fas fa-history"></i>
                                <span>Ver historial</span>
                            </button>
                            <button class="action-btn" onclick="exportarReporte()">
                                <i class="fas fa-file-export"></i>
                                <span>Exportar reporte</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Próximas Tareas -->
                    <div class="sidebar-card">
                        <h4><i class="fas fa-calendar-alt"></i> Próximas</h4>
                        <div id="proximas-tareas">
                            <!-- Cargado dinámicamente -->
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Tareas Completadas -->
            <div class="tasks-card completed-tasks">
                <div class="card-header">
                    <h3><i class="fas fa-check-circle"></i> Tareas Completadas Hoy</h3>
                    <button class="view-all" onclick="verHistorialCompletadas()">Ver Historial Completo</button>
                </div>
                <div class="tasks-list" id="tareas-completadas-container">
                    <!-- Las tareas completadas se cargarán dinámicamente -->
                </div>
            </div>
        </div>
    </main>

    <!-- Modal para Detalles de Tarea -->
    <div id="task-modal" class="modal" style="display: none;">
        <div class="modal-content">
            <!-- El contenido del modal se cargará dinámicamente -->
        </div>
    </div>

    <!-- Modal para Historial -->
    <div id="historial-modal" class="modal" style="display: none;">
        <div class="modal-content">
            <!-- Contenido del historial se cargará dinámicamente -->
        </div>
    </div>

    <script src="scripts/gestion-tareas.js"></script>
    <script>
        // Configuración global
        const CONFIG = {
            empleado_rut: '<?php echo $rut_usuario; ?>',
            empleado_nombre: '<?php echo $nombre_usuario; ?>',
            api_url: 'api/ordenes-empleado.php'
        };
        
        console.log('Configuración empleado:', CONFIG);
    </script>
</body>
</html>