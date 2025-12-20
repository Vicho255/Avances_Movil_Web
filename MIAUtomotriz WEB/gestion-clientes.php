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
$pageTitle = 'Gestión de Clientes';
$notificationCount = 2; // Notificaciones específicas para esta página
$showSearch = true; // Habilitar búsqueda
$showUserInfo = true; // Mostrar info del usuario
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestión de Clientes - MiAutomotriz</title>
    <link rel="stylesheet" href="styles/layout.css">
    <link rel="stylesheet" href="styles/gestion-clientes.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body>
    <!-- Sidebar Navigation -->
    <?php include 'components/sidebar-admin.php'; ?>
    
    <!-- Main Content -->
    <main class="main-content">
        <!-- Header -->
        <?php include 'components/header-admin.php' ; ?>

        <!-- Main Content Grid -->
        <div class="management-container">
            <!-- Form Section -->
            <section class="form-section">
                <!-- En la sección del formulario -->
                <div class="form-card">
                    <div class="card-header">
                        <h2>
                            <i class="fas fa-user-plus"></i>
                            Nuevo Cliente
                        </h2>
                    </div>
                    <form id="clienteForm" class="client-form">
                        <input type="hidden" name="action" value="agregar_cliente">
                        
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="rut">RUT *</label>
                                <input type="text" id="rut" name="rut" required 
                                    placeholder="12345678-9" 
                                    pattern="\d{7,8}-[\dkK]"
                                    title="Formato: 12345678-9">
                                <small class="form-hint">Formato: 12345678-9</small>
                            </div>

                            <div class="form-group">
                                <label for="nombre">Nombre *</label>
                                <input type="text" id="nombre" name="nombre" required>
                            </div>

                            <div class="form-group">
                                <label for="apellido">Apellido *</label>
                                <input type="text" id="apellido" name="apellido" required>
                            </div>

                            <div class="form-group">
                                <label for="email">Email *</label>
                                <input type="email" id="email" name="email" required>
                            </div>

                            <div class="form-group">
                                <label for="telefono">Teléfono *</label>
                                <input type="tel" id="telefono" name="telefono" required>
                            </div>

                            <div class="form-group">
                                <label for="fecha_nac">Fecha de Nacimiento</label>
                                <input type="date" id="fecha_nac" name="fecha_nac">
                            </div>

                            <div class="form-group">
                                <label for="direccion_cp">Código Postal</label>
                                <input type="text" id="direccion_cp" name="direccion_cp">
                            </div>

                            <div class="form-group">
                                <label for="aseguradora_id">Aseguradora</label>
                                <select id="aseguradora_id" name="aseguradora_id">
                                    <option value="Sin Aseguradora">Sin Aseguradora</option>
                                    <?php foreach ($aseguradoras as $aseguradora): ?>
                                        <option value="<?php echo htmlspecialchars($aseguradora['ID']); ?>">
                                            <?php echo htmlspecialchars($aseguradora['Nombre_Empresa']); ?>
                                        </option>
                                    <?php endforeach; ?>
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
                                Guardar Cliente
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
                            Lista de Clientes Registrados
                        </h2>
                        <div class="list-actions">
                            <div class="search-box">
                                <i class="fas fa-search"></i>
                                <input type="text" id="searchClientes" placeholder="Buscar clientes...">
                            </div>
                            <button class="btn-export">
                                <i class="fas fa-download"></i>
                                Exportar
                            </button>
                        </div>
                    </div>

                    <div class="table-container">
                        <table class="clients-table">
                            <thead>
                                <tr>
                                    <th>RUT</th>
                                    <th>Nombre</th>
                                    <th>Apellido</th>
                                    <th>Email</th>
                                    <th>Teléfono</th>
                                    <th>Fecha Registro</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="clientesTableBody">
                                <!-- Los clientes se cargarán aquí dinámicamente -->
                            </tbody>
                        </table>
                    </div>

                    <div class="table-footer">
                        <div class="table-info">
                            Mostrando <span id="clientCount">0</span> clientes
                        </div>
                        <div class="pagination" role="navigation" aria-label="Paginación de clientes">
                            <button class="pagination-btn" disabled aria-label="Página anterior" aria-disabled="true">
                                <i class="fas fa-chevron-left" aria-hidden="true"></i>
                                <span class="sr-only">Página anterior</span>
                            </button>
                            <span class="pagination-info" aria-live="polite">Página 1 de 1</span>
                            <button class="pagination-btn" aria-label="Página siguiente">
                                <i class="fas fa-chevron-right" aria-hidden="true"></i>
                                <span class="sr-only">Página siguiente</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </main>

    <!-- Modal para editar cliente -->
    <div id="editModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Editar Cliente</h3>
                <span class="close-modal">&times;</span>
            </div>
            <form id="editClienteForm" class="modal-form">
                <input type="hidden" id="editClienteId">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="editNombre">Nombre Completo</label>
                        <input type="text" id="editNombre" name="nombre" required>
                    </div>
                    <div class="form-group">
                        <label for="editEmail">Email</label>
                        <input type="email" id="editEmail" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="editTelefono">Teléfono</label>
                        <input type="tel" id="editTelefono" name="telefono" required>
                    </div>
                    <div class="form-group">
                        <label for="editDocumento">Documento</label>
                        <input type="text" id="editDocumento" name="documento" required>
                    </div>
                    <div class="form-group full-width">
                        <label for="editDireccion">Dirección</label>
                        <textarea id="editDireccion" name="direccion" rows="3"></textarea>
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary close-modal">Cancelar</button>
                    <button type="submit" class="btn-primary">Actualizar Cliente</button>
                </div>
            </form>
        </div>
    </div>

    <!-- JavaScript -->
    <script src="components/theme-manager.js"></script>
    <script src="scripts/gestionClientes.js"></script>
    <script src="scripts/cargar-clientes.js"></script>
    
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
            console.log('Sesión activa gestión clientes:', {
                usuario: '<?php echo $_SESSION['usuario'] ?? ''; ?>',
                tipo: '<?php echo $_SESSION['tipo_persona'] ?? ''; ?>',
                rut: '<?php echo $_SESSION['rut'] ?? ''; ?>'
            });
        });
    </script>
</body>
</html>