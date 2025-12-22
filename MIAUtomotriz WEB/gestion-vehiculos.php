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

// Configurar header específico para gestión de clientes
$pageTitle = 'Gestión de Vehiculos';
$notificationCount = 2; // Notificaciones específicas para esta página
$showSearch = true; // Habilitar búsqueda
$showUserInfo = true; // Mostrar info del usuario

// Cargar datos iniciales desde BD
require_once 'config/database.php';
try {
    $db = getDB();
    
    // Cargar tipos de vehículos
    $stmtTipos = $db->query("SELECT Codigo, Nombre FROM Tipo_Vehiculo ORDER BY Nombre");
    $tipos_vehiculos = $stmtTipos ? $stmtTipos->fetchAll(PDO::FETCH_ASSOC) : [];
    
    // Cargar marcas
    $stmtMarcas = $db->query("SELECT Codigo, Nombre FROM Marca ORDER BY Nombre");
    $marcas = $stmtMarcas ? $stmtMarcas->fetchAll(PDO::FETCH_ASSOC) : [];
    
    // Cargar modelos (todos inicialmente)
    $stmtModelos = $db->query("SELECT Codigo, Nombre FROM Modelo ORDER BY Nombre");
    $modelos = $stmtModelos ? $stmtModelos->fetchAll(PDO::FETCH_ASSOC) : [];
    
    // Cargar clientes para select de dueño
    $stmtClientes = $db->prepare("
        SELECT RUT, Nombre, Apellido 
        FROM Persona 
        WHERE Tipo_Persona = 'Cliente' 
        ORDER BY Nombre
    ");
    $stmtClientes->execute();
    $clientes = $stmtClientes->fetchAll(PDO::FETCH_ASSOC);
    
} catch (PDOException $e) {
    // Inicializar arrays vacíos si hay error
    $tipos_vehiculos = [];
    $marcas = [];
    $modelos = [];
    $clientes = [];
    $error_bd = "Error al cargar datos: " . $e->getMessage();
    error_log("Error BD en gestion-vehiculos.php: " . $e->getMessage());
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestión de Vehículos - MiAutomotriz</title>
    <link rel="stylesheet" href="styles/layout.css">
    <link rel="stylesheet" href="styles/gestion-vehiculos.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        .no-data, .error-data {
            text-align: center;
            padding: 30px;
            color: #666;
        }
        .no-data i, .error-data i {
            font-size: 48px;
            margin-bottom: 15px;
            display: block;
            color: #ccc;
        }
        .error-data {
            color: #dc3545;
        }
        .btn-reload {
            margin-top: 15px;
            padding: 8px 16px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .btn-reload:hover {
            background: #0056b3;
        }
        .search-box {
            position: relative;
        }
        .search-box i {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            color: #666;
        }
        .search-box input {
            padding-left: 35px;
        }
    </style>
</head>
<body>
    <!-- Sidebar Navigation -->
    <?php include 'components/sidebar-admin.php'; ?>
    
    <!-- Main Content -->
    <main class="main-content">
        <!-- Header -->
        <?php include 'components/header-admin.php'; ?>

        <!-- Main Content Grid -->
        <div class="management-container">
            <!-- Form Section -->
            <section class="form-section">
                <div class="form-card">
                    <div class="card-header">
                        <h2>
                            <i class="fas fa-car"></i>
                            Nuevo Vehículo
                        </h2>
                    </div>
                    <form id="vehiculoForm" class="vehicle-form">
                        <input type="hidden" name="action" value="agregar_vehiculo">
                        
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="patente">Patente *</label>
                                <input type="text" id="patente" name="patente" required 
                                pattern="[A-Z]{3,4}[0-9]{3}" 
                                title="Formato: ABC123 (6 caracteres) o ABCD123 (7 caracteres)"
                                placeholder="Ej: ABC123 o ABCD123">
                            </div>

                            <div class="form-group">
                                <label for="tipo_vehiculo">Tipo de Vehículo</label>
                                <select id="tipo_vehiculo" name="tipo_vehiculo_id">
                                    <option value="">Seleccionar tipo</option>
                                    <?php 
                                    if (!empty($tipos_vehiculos)): 
                                        foreach ($tipos_vehiculos as $tipo): 
                                            // Verificar que las claves existan
                                            $codigo = htmlspecialchars($tipo['Codigo'] ?? $tipo['codigo'] ?? '');
                                            $nombre = htmlspecialchars($tipo['Nombre'] ?? $tipo['nombre'] ?? 'Desconocido');
                                    ?>
                                        <option value="<?php echo $codigo; ?>">
                                            <?php echo $nombre; ?>
                                        </option>
                                    <?php 
                                        endforeach;
                                    else: 
                                    ?>
                                        <option value="">No hay tipos disponibles</option>
                                    <?php endif; ?>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="marca">Marca</label>
                                <select id="marca" name="marca_id">
                                    <option value="">Seleccionar marca</option>
                                    <?php 
                                    if (!empty($marcas)): 
                                        foreach ($marcas as $marca): 
                                            $codigo = htmlspecialchars($marca['Codigo'] ?? $marca['codigo'] ?? '');
                                            $nombre = htmlspecialchars($marca['Nombre'] ?? $marca['nombre'] ?? 'Desconocido');
                                    ?>
                                        <option value="<?php echo $codigo; ?>">
                                            <?php echo $nombre; ?>
                                        </option>
                                    <?php 
                                        endforeach;
                                    else: 
                                    ?>
                                        <option value="">No hay marcas disponibles</option>
                                    <?php endif; ?>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="modelo">Modelo</label>
                                <select id="modelo" name="modelo_id" disabled>
                                    <option value="">Seleccionar modelo</option>
                                    <!-- Los modelos se cargarán dinámicamente via JavaScript -->
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="color">Color</label>
                                <input type="text" id="color" name="color" placeholder="Ej: Rojo, Azul, Negro">
                            </div>

                            <div class="form-group">
                                <label for="anio">Año</label>
                                <input type="number" id="anio" name="anio" 
                                min="1900" max="<?php echo date('Y') + 1; ?>"
                                placeholder="Ej: 2020">
                            </div>

                            <div class="form-group">
                                <label for="dueno">Dueño</label>
                                <select id="dueno" name="persona_rut">
                                    <option value="">No Asignado</option>
                                    <?php 
                                    if (!empty($clientes)): 
                                        foreach ($clientes as $cliente): 
                                            $rut = htmlspecialchars($cliente['RUT'] ?? $cliente['rut'] ?? '');
                                            $nombre = htmlspecialchars($cliente['Nombre'] ?? $cliente['nombre'] ?? '');
                                            $apellido = htmlspecialchars($cliente['Apellido'] ?? $cliente['apellido'] ?? '');
                                            $nombre_completo = trim($nombre . ' ' . $apellido);
                                    ?>
                                        <option value="<?php echo $rut; ?>">
                                            <?php echo $nombre_completo . ' (' . $rut . ')'; ?>
                                        </option>
                                    <?php 
                                        endforeach;
                                    else: 
                                    ?>
                                        <option value="">No hay clientes registrados</option>
                                    <?php endif; ?>
                                </select>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-secondary" id="btnLimpiar">
                                <i class="fas fa-broom"></i>
                                Limpiar
                            </button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-save"></i>
                                Guardar Vehículo
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            <!-- List Section -->
            <section class="list-section">
                <div class="list-card">
                    <div class="card-header">
                        <h2>
                            <i class="fas fa-list"></i>
                            Lista de Vehículos
                        </h2>
                        <div class="list-actions">
                            <div class="search-box">
                                <i class="fas fa-search"></i>
                                <input type="text" id="searchVehiculos" placeholder="Buscar vehículos...">
                            </div>
                            <button class="btn-export" id="btnExportar">
                                <i class="fas fa-download"></i>
                                Exportar
                            </button>
                        </div>
                    </div>

                    <div class="table-container">
                        <table class="clients-table">
                            <thead>
                                <tr>
                                    <th>Patente</th>
                                    <th>Tipo</th>
                                    <th>Marca</th>
                                    <th>Modelo</th>
                                    <th>Año</th>
                                    <th>Color</th>
                                    <th>Dueño</th>
                                </tr>
                            </thead>
                            <tbody id="vehiculosTableBody">
                                <!-- Los vehículos se cargarán aquí dinámicamente -->
                                <tr>
                                    <td colspan="7" class="no-data">
                                        <i class="fas fa-spinner fa-spin"></i>
                                        Cargando vehículos...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="table-footer">
                        <div class="table-info">
                            Mostrando <span id="vehiculosCount">0</span> vehículos
                        </div>
                        <div class="pagination" role="navigation" aria-label="Paginación">
                            <button class="pagination-btn" id="btnPrev" disabled>
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <span class="pagination-info">Página <span id="currentPage">1</span></span>
                            <button class="pagination-btn" id="btnNext">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </main>

    <!-- JavaScript -->
    <script src="components/theme-manager.js"></script>
    <script src="scripts/gestion-vehiculos.js"></script>
    
    <script>
        // Actualizar hora en tiempo real
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
            const element = document.getElementById('currentDateTime');
            if (element) {
                element.textContent = now.toLocaleDateString('es-ES', options);
            }
        }
        
        setInterval(updateDateTime, 1000);
        updateDateTime();
        
        // Toggle sidebar en móvil
        document.addEventListener('DOMContentLoaded', function() {
            const menuToggle = document.querySelector('.menu-toggle');
            const sidebar = document.querySelector('.sidebar');
            
            if (menuToggle && sidebar) {
                menuToggle.addEventListener('click', () => {
                    sidebar.classList.toggle('active');
                });
            }
            
            // Mostrar información de sesión en consola
            console.log('Sesión activa:', {
                usuario: '<?php echo $_SESSION['usuario'] ?? ''; ?>',
                tipo: '<?php echo $_SESSION['tipo_persona'] ?? ''; ?>'
            });
        });
    </script>
</body>
</html>