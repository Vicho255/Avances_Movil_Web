<?php
session_start();

// VERIFICACIÓN DE SESIÓN
if(!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== TRUE){
    header('Location: login.php');
    exit();
}

// Verificar que sea administrador
if($_SESSION['tipo_persona'] !== 'Administrador'){
    header('Location: login.php');
    exit();
}

// Obtener datos del usuario de la sesión
$nombre_usuario = $_SESSION['usuario'] ?? 'Administrador';
$rut_usuario = $_SESSION['rut'] ?? '';

// Configurar header específico para gestión de empleados
$pageTitle = 'Gestión de Empleados';
$notificationCount = 2; // Notificaciones específicas para esta página
$showSearch = true; // Habilitar búsqueda
$showUserInfo = true; // Mostrar info del usuario
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="styles/layout.css">
    <link rel="stylesheet" href="styles/gestion-empleados.css">
    <title>Gestion de Empleados - MiAutomotriz</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body>
    
    <?php include 'components/sidebar-admin.php'; ?>

    <main class="main-content">
        
        <?php include 'components/header-admin.php'; ?>

        <div class="management-container">
            <section class="employee-management">
                <div class="list-card">
                <div class="section-header">
                    <h2>
                        <i class="fas fa-list"></i>
                        Lista de Empleados
                    </h2>
                    <div class="list-actions">
                            <div class="search-box">
                                <i class="fas fa-search"></i>
                                <input type="text" id="searchEmpleados" placeholder="Buscar empleados...">
                            </div>
                            <button class="btn-export">
                                <i class="fas fa-download"></i>
                                Exportar
                            </button>
                    </div>
                </div>

                <div class="employee-table-container">
                    <table class="employee-table">
                        <thead>
                            <tr>
                                <th>RUT</th>
                                <th>Nombre</th>
                                <th>Posición</th>
                                <th>Correo Electrónico</th>
                                <th>Teléfono</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="employeeTableBody">
                            <!-- Filas de empleados generadas dinámicamente -->
                        </tbody>
                    </table>
                </div>
                <div class="table-footer">
                        <div class="table-info">
                            Mostrando <span id="employeeCount">0</span> Empleados
                        </div>
                        <div class="pagination">
                            <button class="pagination-btn" disabled>
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <span class="pagination-info">Página 1 de 1</span>
                            <button class="pagination-btn">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                            <button class="add-employee-btn">Agregar Empleado</button>
                        </div>
                </div>
            </section>
        </div>
    </main>

    <script src="components/theme-manager.js"></script>
    <script src="scripts/gestion-empleados.js" defer></script>
</body>
</html>