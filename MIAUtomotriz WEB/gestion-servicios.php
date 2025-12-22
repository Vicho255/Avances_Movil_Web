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

// Configurar header
$pageTitle = 'Gestión de Servicios';
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $pageTitle; ?> - MiAutomotriz</title>
    <link rel="stylesheet" href="styles/layout.css">
    <link rel="stylesheet" href="styles/gestion-servicios.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body>
    <!-- Sidebar Navigation -->
    <?php include 'components/sidebar-admin.php'; ?>

    <!-- Main Content -->
    <main class="main-content">
        <!-- Header -->
        <?php include 'components/header-admin.php'; ?>
        
        <div class="ordenes-container">
            <h1>Gestión de Órdenes de Trabajo</h1>
            
            <!-- Formulario para nueva orden -->
            <div class="form-section">
                <h2><i class="fas fa-plus-circle"></i> Nueva Orden de Trabajo</h2>
                <form id="form-nueva-orden" class="orden-form">
                    <!-- Sección Cliente -->
                    <div class="form-section-card">
                        <h3><i class="fas fa-user"></i> Datos del Cliente</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="cliente-rut">RUT Cliente:</label>
                                <div class="search-container">
                                    <div class="search-wrapper">
                                        <input type="text" id="cliente-search" class="search-input" 
                                               placeholder="Buscar cliente por nombre o RUT..."
                                               onkeyup="filtrarClientes(this.value)">
                                        <div class="search-dropdown" id="clientes-dropdown" style="display: none;"></div>
                                    </div>
                                    <input type="hidden" id="cliente-rut" name="cliente_rut" required>
                                    <button type="button" class="btn-refresh" onclick="cargarClientes()">
                                        <i class="fas fa-sync-alt"></i>
                                    </button>
                                </div>
                                <div id="cliente-info" class="cliente-info" style="display: none;">
                                    <p><strong>Nombre:</strong> <span id="cliente-nombre"></span></p>
                                    <p><strong>Teléfono:</strong> <span id="cliente-telefono"></span></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Sección Vehículo -->
                    <div class="form-section-card">
                        <h3><i class="fas fa-car"></i> Datos del Vehículo</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="vehiculo-patente">Patente del Vehículo:</label>
                                <div class="search-container">
                                    <div class="search-wrapper">
                                        <input type="text" id="vehiculo-search" class="search-input" 
                                               placeholder="Buscar vehículo por patente, marca o dueño..."
                                               onkeyup="filtrarVehiculos(this.value)">
                                        <div class="search-dropdown" id="vehiculos-dropdown" style="display: none;"></div>
                                    </div>
                                    <input type="hidden" id="vehiculo-patente" name="vehiculo_patente" required>
                                    <button type="button" class="btn-refresh" onclick="cargarVehiculos()">
                                        <i class="fas fa-sync-alt"></i>
                                    </button>
                                </div>
                                <div id="vehiculo-info" class="vehiculo-info" style="display: none;">
                                    <p><strong>Marca/Modelo:</strong> <span id="vehiculo-modelo"></span></p>
                                    <p><strong>Color:</strong> <span id="vehiculo-color"></span></p>
                                    <p><strong>Dueño:</strong> <span id="vehiculo-dueno"></span></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Sección Descripción y Averías -->
                    <div class="form-section-card">
                        <h3><i class="fas fa-clipboard-list"></i> Descripción y Averías</h3>
                        
                        <div class="form-group">
                            <label for="descripcion">Descripción del Problema:</label>
                            <textarea id="descripcion" name="descripcion" rows="4" 
                                      placeholder="Describa el problema o servicio requerido..." required></textarea>
                        </div>

                        <!-- Lista de averías (máximo 10) -->
                        <div class="averias-section">
                            <label><i class="fas fa-tools"></i> Averías/Daños Detectados (Máximo 10):</label>
                            <div class="averias-container" id="averias-container">
                                <!-- Las averías se agregarán dinámicamente aquí -->
                            </div>
                            <div class="averias-controls">
                                <button type="button" id="agregar-averia" class="btn btn-secondary" onclick="agregarAveria()">
                                    <i class="fas fa-plus"></i> Agregar Avería
                                </button>
                                <span class="averias-counter" id="averias-counter">0/10 averías</span>
                            </div>
                        </div>

                        <!-- Lista de repuestos (opcional) -->
                        <div class="repuestos-section">
                            <label><i class="fas fa-cogs"></i> Repuestos Necesarios (Opcional):</label>
                            <div class="repuestos-container" id="repuestos-container">
                                <!-- Los repuestos se agregarán dinámicamente aquí -->
                            </div>
                            <div class="repuestos-controls">
                                <button type="button" id="agregar-repuesto" class="btn btn-secondary" onclick="agregarRepuesto()">
                                    <i class="fas fa-plus"></i> Agregar Repuesto
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Sección Trabajador -->
                    <div class="form-section-card">
                        <h3><i class="fas fa-user-tie"></i> Asignar Trabajador</h3>
                        <div class="form-group">
                            <label for="trabajador-rut">Trabajador Responsable:</label>
                            <select id="trabajador-rut" name="trabajador_rut" required>
                                <option value="">Seleccionar trabajador...</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Crear Orden de Trabajo
                        </button>
                        <button type="button" id="btn-limpiar" class="btn btn-secondary" onclick="limpiarFormulario()">
                            <i class="fas fa-broom"></i> Limpiar Formulario
                        </button>
                    </div>
                </form>
            </div>

            <!-- Lista de órdenes activas -->
            <div class="ordenes-activas-section">
                <h2><i class="fas fa-list-alt"></i> Órdenes de Trabajo Activas</h2>
                <div class="filtros">
                    <div class="filtro-group">
                        <label for="filtro-estado">Filtrar por Estado:</label>
                        <select id="filtro-estado" onchange="aplicarFiltros()">
                            <option value="">Todos (excepto Completadas)</option>
                            <option value="Pendiente">Pendientes</option>
                            <option value="En Proceso">En Proceso</option>
                            <option value="Cancelada">Canceladas</option>
                        </select>
                    </div>
                    <div class="filtro-group">
                        <label for="filtro-trabajador">Filtrar por Trabajador:</label>
                        <select id="filtro-trabajador" onchange="aplicarFiltros()">
                            <option value="">Todos los trabajadores</option>
                        </select>
                    </div>
                    <button id="btn-refresh-ordenes" class="btn-refresh" onclick="cargarOrdenes()">
                        <i class="fas fa-sync-alt"></i> Actualizar
                    </button>
                </div>

                <div class="ordenes-grid" id="ordenes-grid">
                    <div class="loading">Cargando órdenes de trabajo...</div>
                </div>

                <!-- Paginación -->
                <div class="paginacion" id="paginacion" style="display: none;">
                    <button id="btn-anterior" class="btn-pag" onclick="cambiarPagina(-1)">
                        <i class="fas fa-chevron-left"></i> Anterior
                    </button>
                    <span id="pagina-info">Página 1 de 1</span>
                    <button id="btn-siguiente" class="btn-pag" onclick="cambiarPagina(1)">
                        Siguiente <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>
    </main>

    <!-- Modal para detalles de orden -->
    <div id="modal-detalles" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="cerrarModal()">&times;</span>
            <div id="modal-content"></div>
        </div>
    </div>

    <script src="components/theme-manager.js"></script>
    <script src="scripts/gestion-servicios.js"></script>
</body>
</html>