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
$pageTitle = 'Gestión de Facturas';
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $pageTitle; ?> - MiAutomotriz</title>
    <link rel="stylesheet" href="styles/layout.css">
    <link rel="stylesheet" href="styles/gestion-facturas.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"></script>
</head>
<body>
    <!-- Sidebar Navigation -->
    <?php include 'components/sidebar-admin.php'; ?>

    <!-- Main Content -->
    <main class="main-content">
        <!-- Header -->
        <?php include 'components/header-admin.php'; ?>
        <!-- Page Content -->
        <section class="form-section">
            <h1>Gestión de Facturas</h1>
            <div class="form-container">
                <form id="factura-form">
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

                    <div class="form-group">
                        <label for="orden-trabajo">Orden de Trabajo:</label>
                        <div class="search-container">
                            <div class="search-wrapper">
                                <select id="orden-select" class="search-input" 
                                        onchange="cargarDetallesOrden(this.value)">
                                    <option value="">Seleccione una orden de trabajo</option>
                                </select>
                            </div>
                            <button type="button" class="btn-refresh" onclick="cargarOrdenesCliente()">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                        </div>
                        <div id="orden-info" class="orden-info" style="display: none;">
                            <p><strong>Vehículo:</strong> <span id="orden-vehiculo"></span></p>
                            <p><strong>Descripción:</strong> <span id="orden-descripcion"></span></p>
                            <p><strong>Estado:</strong> <span id="orden-estado"></span></p>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="fecha">Fecha Factura:</label>
                        <input type="date" id="fecha" name="fecha" required>
                    </div>

                    <div class="form-group">
                        <label for="metodo-pago">Método de Pago:</label>
                        <select id="metodo-pago" name="metodo_pago" required>
                            <option value="">Seleccione método</option>
                            <option value="Efectivo">Efectivo</option>
                            <option value="Transferencia">Transferencia Bancaria</option>
                            <option value="Tarjeta Crédito">Tarjeta de Crédito</option>
                            <option value="Tarjeta Débito">Tarjeta de Débito</option>
                            <option value="Cheque">Cheque</option>
                        </select>
                    </div>

                    <!-- Detalles de la Orden (se cargan dinámicamente) -->
                    <div id="detalles-orden" style="display: none;">
                        <h3>Detalles de la Orden</h3>
                        <div class="detalles-container">
                            <!-- Repuestos -->
                            <div class="detalle-seccion">
                                <h4>Repuestos Utilizados</h4>
                                <table id="tabla-repuestos" class="detalle-tabla">
                                    <thead>
                                        <tr>
                                            <th>Repuesto</th>
                                            <th>Cantidad</th>
                                            <th>Costo Unitario</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody></tbody>
                                </table>
                            </div>

                            <!-- Mano de Obra -->
                            <div class="detalle-seccion">
                                <h4>Mano de Obra</h4>
                                <table id="tabla-mano-obra" class="detalle-tabla">
                                    <thead>
                                        <tr>
                                            <th>Descripción</th>
                                            <th>Costo</th>
                                        </tr>
                                    </thead>
                                    <tbody></tbody>
                                </table>
                            </div>

                            <!-- Totales -->
                            <div class="totales-container">
                                <div class="total-item">
                                    <strong>Neto:</strong>
                                    <span id="total-neto">$0</span>
                                </div>
                                <div class="total-item">
                                    <strong>IVA (19%):</strong>
                                    <span id="total-iva">$0</span>
                                </div>
                                <div class="total-item total-final">
                                    <strong>TOTAL:</strong>
                                    <span id="total-final">$0</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="form-buttons">
                        <button type="submit" class="btn-primary">Generar Factura</button>
                        <button type="button" class="btn-secondary" onclick="generarPDF()">
                            <i class="fas fa-file-pdf"></i> Generar PDF
                        </button>
                        <button type="button" class="btn-success" onclick="guardarFactura()">
                            <i class="fas fa-save"></i> Guardar en Base de Datos
                        </button>
                    </div>
                </form>
            </div>
        </section>

        <!-- Vista Previa PDF -->
        <section class="pdf-section" style="display: none;">
            <h2>Vista Previa de Factura</h2>
            <div id="pdf-preview" class="pdf-preview"></div>
        </section>

    </main>
    <script src="components/theme-manager.js"></script>
    <script src="scripts/gestion-facturas.js"></script>
</body>
</html>