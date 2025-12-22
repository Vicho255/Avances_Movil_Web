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

$nombre_usuario = $_SESSION['usuario'] ?? 'Administrador';
$rut_usuario = $_SESSION['rut'] ?? '';
$pageTitle = 'Gestión de Cotizaciones';
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $pageTitle; ?> - MiAutomotriz</title>
    <link rel="stylesheet" href="styles/layout.css">
    <link rel="stylesheet" href="styles/gestion-cotizaciones.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"></script>
</head>
<body>
    <?php include 'components/sidebar-admin.php'; ?>

    <main class="main-content">
        <?php include 'components/header-admin.php'; ?>
        
        <section class="form-section">
            <h1>Generación de Cotizaciones</h1>
            <div class="form-container">
                <form id="cotizacion-form">
                    <!-- Datos del Cliente -->
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
                            <p><strong>Correo:</strong> <span id="cliente-correo"></span></p>
                        </div>
                    </div>

                    <!-- Información del Vehículo -->
                    <div class="form-group">
                        <label for="vehiculo-patente">Vehículo:</label>
                        <div class="search-container">
                            <div class="search-wrapper">
                                <input type="text" id="vehiculo-search" class="search-input" 
                                        placeholder="Buscar vehículo por patente..."
                                        onkeyup="filtrarVehiculos(this.value)">
                                <div class="search-dropdown" id="vehiculos-dropdown" style="display: none;"></div>
                            </div>
                            <input type="hidden" id="vehiculo-patente" name="vehiculo_patente">
                            <button type="button" class="btn-refresh" onclick="cargarVehiculos()">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                        </div>
                        <div id="vehiculo-info" class="vehiculo-info" style="display: none;">
                            <p><strong>Marca/Modelo:</strong> <span id="vehiculo-modelo"></span></p>
                            <p><strong>Color:</strong> <span id="vehiculo-color"></span></p>
                            <p><strong>Año:</strong> <span id="vehiculo-anio"></span></p>
                        </div>
                    </div>

                    <!-- Fecha y Vigencia -->
                    <div class="form-row">
                        <div class="form-group">
                            <label for="fecha-emision">Fecha Emisión:</label>
                            <input type="date" id="fecha-emision" name="fecha_emision" required>
                        </div>
                        <div class="form-group">
                            <label for="fecha-fin">Válida hasta:</label>
                            <input type="date" id="fecha-fin" name="fecha_fin" required>
                        </div>
                    </div>

                    <!-- Descripción -->
                    <div class="form-group">
                        <label for="descripcion">Descripción del Trabajo:</label>
                        <textarea id="descripcion" name="descripcion" rows="3" 
                                  placeholder="Describa el trabajo a realizar..."></textarea>
                    </div>

                    <!-- Sección de Repuestos -->
                    <div class="seccion-cotizacion">
                        <h3>Repuestos Requeridos</h3>
                        <div class="search-container">
                            <div class="search-wrapper">
                                <input type="text" id="repuesto-search" class="search-input" 
                                        placeholder="Buscar repuesto por nombre..."
                                        onkeyup="filtrarRepuestos(this.value)">
                                <div class="search-dropdown" id="repuestos-dropdown" style="display: none;"></div>
                            </div>
                            <button type="button" class="btn-refresh" onclick="cargarRepuestos()">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                        </div>
                        
                        <div id="repuestos-lista" class="lista-items">
                            <!-- Los repuestos se agregarán dinámicamente aquí -->
                        </div>
                    </div>

                    <!-- Sección de Mano de Obra -->
                    <div class="seccion-cotizacion">
                        <h3>Mano de Obra</h3>
                        <div class="search-container">
                            <div class="search-wrapper">
                                <select id="mano-obra-select" class="search-input">
                                    <option value="">Seleccionar tipo de trabajo</option>
                                </select>
                            </div>
                            <button type="button" class="btn-add" onclick="agregarManoObra()">
                                <i class="fas fa-plus"></i> Agregar
                            </button>
                        </div>
                        
                        <div id="mano-obra-lista" class="lista-items">
                            <!-- Los ítems de mano de obra se agregarán aquí -->
                        </div>
                    </div>

                    <!-- Sección de Piezas Externas -->
                    <div class="seccion-cotizacion">
                        <h3>Piezas Externas/Especiales</h3>
                        <button type="button" class="btn-add" onclick="agregarPiezaExterna()">
                            <i class="fas fa-plus"></i> Agregar Pieza Externa
                        </button>
                        
                        <div id="piezas-externas-lista" class="lista-items">
                            <!-- Las piezas externas se agregarán aquí -->
                        </div>
                    </div>

                    <!-- Totales -->
                    <div class="totales-container">
                        <div class="total-item">
                            <strong>Subtotal Repuestos:</strong>
                            <span id="subtotal-repuestos">$0</span>
                        </div>
                        <div class="total-item">
                            <strong>Subtotal Mano de Obra:</strong>
                            <span id="subtotal-mano-obra">$0</span>
                        </div>
                        <div class="total-item">
                            <strong>Subtotal Piezas Externas:</strong>
                            <span id="subtotal-externas">$0</span>
                        </div>
                        <div class="total-item">
                            <strong>Total Neto:</strong>
                            <span id="total-neto">$0</span>
                        </div>
                        <div class="total-item">
                            <strong>IVA (19%):</strong>
                            <span id="total-iva">$0</span>
                        </div>
                        <div class="total-item total-final">
                            <strong>TOTAL COTIZACIÓN:</strong>
                            <span id="total-final">$0</span>
                        </div>
                    </div>

                    <!-- Botones de Acción -->
                    <div class="form-buttons">
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i> Guardar Cotización
                        </button>
                        <button type="button" class="btn-secondary" onclick="generarPDF()">
                            <i class="fas fa-file-pdf"></i> Generar PDF
                        </button>
                        <button type="button" class="btn-success" onclick="enviarPorCorreo()">
                            <i class="fas fa-envelope"></i> Enviar por Correo
                        </button>
                        <button type="button" class="btn-info" onclick="limpiarFormulario()">
                            <i class="fas fa-redo"></i> Limpiar
                        </button>
                    </div>
                    <div id="confirmModal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <h3>Confirmar Cotización</h3>
                        <div id="confirmDetails"></div>
                        <div class="modal-buttons">
                            <button type="button" class="btn-secondary" onclick="closeModal()">Cancelar</button>
                            <button type="button" class="btn-primary" onclick="confirmSave()">Confirmar</button>
                        </div>
                        </div>
                    </div>
                </form>
            </div>
        </section>

        <!-- Vista Previa PDF -->
        <section class="pdf-section" style="display: none;">
            <h2>Vista Previa de Cotización</h2>
            <div id="pdf-preview" class="pdf-preview"></div>
        </section>

    </main>
    <script src="components/theme-manager.js"></script>
    <script src="scripts/gestion-cotizaciones.js"></script>
    <script>
        // Funciones para el modal
        function showConfirmationModal() {
            if (!validarFormularioCotizacion()) {
                return;
            }
            
            const { totalNeto, iva, totalFinal } = calcularTotales();
            
            const details = `
                <p><strong>Cliente:</strong> ${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}</p>
                <p><strong>Fecha Emisión:</strong> ${document.getElementById('fecha-emision').value}</p>
                <p><strong>Válida hasta:</strong> ${document.getElementById('fecha-fin').value}</p>
                <p><strong>Total Neto:</strong> $${totalNeto.toLocaleString('es-CL')}</p>
                <p><strong>IVA:</strong> $${iva.toLocaleString('es-CL')}</p>
                <p><strong>TOTAL:</strong> $${totalFinal.toLocaleString('es-CL')}</p>
                <p><strong>Items:</strong> ${repuestosSeleccionados.length} repuestos, ${manoObraSeleccionada.length} trabajos, ${piezasExternas.length} piezas externas</p>
            `;
            
            document.getElementById('confirmDetails').innerHTML = details;
            document.getElementById('confirmModal').style.display = 'flex';
        }

        function closeModal() {
            document.getElementById('confirmModal').style.display = 'none';
        }

        function confirmSave() {
            closeModal();
            guardarCotizacion();
        }

        // Actualiza el event listener del formulario
        document.getElementById('cotizacion-form').addEventListener('submit', function(e) {
            e.preventDefault();
            showConfirmationModal();
        });
    </script>
</body>
</html>