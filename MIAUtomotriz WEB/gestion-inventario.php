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
$pageTitle = 'Gestión de Inventario';
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $pageTitle; ?> - MiAutomotriz</title>
    <link rel="stylesheet" href="styles/layout.css">
    <link rel="stylesheet" href="styles/gestion-inventario.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body>
    <?php include 'components/sidebar-admin.php'; ?>

    <main class="main-content">
        <?php include 'components/header-admin.php'; ?>
        
        <section class="inventario-section">
            <div class="section-header">
                <h1><i class="fas fa-warehouse"></i> Gestión de Inventario</h1>
                <div class="header-actions">
                    <button class="btn-primary" onclick="mostrarModalAgregar()">
                        <i class="fas fa-plus"></i> Nuevo Repuesto
                    </button>
                    <button class="btn-secondary" onclick="cargarInventario()">
                        <i class="fas fa-sync-alt"></i> Actualizar
                    </button>
                    <button class="btn-info" onclick="generarReporte()">
                        <i class="fas fa-chart-bar"></i> Reporte
                    </button>
                </div>
            </div>

            <!-- Filtros y búsqueda -->
            <div class="filtros-container">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" id="buscar-repuesto" placeholder="Buscar repuesto..." 
                           onkeyup="filtrarInventario()">
                </div>
                
                <div class="filtros-group">
                    <select id="filtro-categoria" onchange="filtrarInventario()">
                        <option value="">Todas las categorías</option>
                        <option value="Motor">Motor</option>
                        <option value="Frenos">Frenos</option>
                        <option value="Suspensión">Suspensión</option>
                        <option value="Electricidad">Electricidad</option>
                        <option value="Carrocería">Carrocería</option>
                        <option value="Aceites">Aceites</option>
                        <option value="Filtros">Filtros</option>
                        <option value="Otros">Otros</option>
                    </select>
                    
                    <select id="filtro-estado" onchange="filtrarInventario()">
                        <option value="">Todos los estados</option>
                        <option value="stock-bajo">Stock Bajo (< 5)</option>
                        <option value="stock-normal">Stock Normal</option>
                        <option value="sin-stock">Sin Stock</option>
                    </select>
                    
                    <button class="btn-clear" onclick="limpiarFiltros()">
                        <i class="fas fa-times"></i> Limpiar
                    </button>
                </div>
            </div>

            <!-- Estadísticas -->
            <div class="estadisticas-container">
                <div class="estadistica-card">
                    <div class="estadistica-icon" style="background: #4CAF50;">
                        <i class="fas fa-boxes"></i>
                    </div>
                    <div class="estadistica-info">
                        <h3 id="total-repuestos">0</h3>
                        <p>Total Repuestos</p>
                    </div>
                </div>
                
                <div class="estadistica-card">
                    <div class="estadistica-icon" style="background: #2196F3;">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                    <div class="estadistica-info">
                        <h3 id="valor-total">$0</h3>
                        <p>Valor Total</p>
                    </div>
                </div>
                
                <div class="estadistica-card">
                    <div class="estadistica-icon" style="background: #FF9800;">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="estadistica-info">
                        <h3 id="stock-bajo">0</h3>
                        <p>Stock Bajo</p>
                    </div>
                </div>
                
                <div class="estadistica-card">
                    <div class="estadistica-icon" style="background: #F44336;">
                        <i class="fas fa-times-circle"></i>
                    </div>
                    <div class="estadistica-info">
                        <h3 id="sin-stock">0</h3>
                        <p>Sin Stock</p>
                    </div>
                </div>
            </div>

            <!-- Tabla de inventario -->
            <div class="table-container">
                <table id="tabla-inventario" class="inventario-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nombre</th>
                            <th>Categoría</th>
                            <th>Cantidad</th>
                            <th>Costo</th>
                            <th>Valor Total</th>
                            <th>Número Pieza</th>
                            <th>Ubicación</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="inventario-body">
                        <!-- Los datos se cargarán aquí -->
                    </tbody>
                </table>
                
                <div id="loading" class="loading">
                    <i class="fas fa-spinner fa-spin"></i> Cargando inventario...
                </div>
                
                <div id="no-results" class="no-results" style="display: none;">
                    <i class="fas fa-search"></i>
                    <p>No se encontraron repuestos</p>
                </div>
            </div>

            <!-- Paginación -->
            <div class="paginacion" id="paginacion" style="display: none;">
                <button class="btn-pag" onclick="cambiarPagina(-1)">
                    <i class="fas fa-chevron-left"></i> Anterior
                </button>
                <span id="pagina-info">Página 1 de 1</span>
                <button class="btn-pag" onclick="cambiarPagina(1)">
                    Siguiente <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </section>
    </main>

    <!-- Modal para agregar/editar repuesto -->
    <div id="modal-repuesto" class="modal" style="display: none;">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="modal-titulo">Nuevo Repuesto</h2>
                <button class="btn-close" onclick="cerrarModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form id="form-repuesto" class="modal-form">
                <input type="hidden" id="repuesto-id">
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="codigo">Código *</label>
                        <input type="text" id="codigo" name="codigo" required 
                               placeholder="Ej: REP001">
                    </div>
                    
                    <div class="form-group">
                        <label for="nombre">Nombre *</label>
                        <input type="text" id="nombre" name="nombre" required 
                               placeholder="Nombre del repuesto">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="categoria">Categoría *</label>
                        <select id="categoria" name="categoria" required>
                            <option value="">Seleccionar</option>
                            <option value="Motor">Motor</option>
                            <option value="Frenos">Frenos</option>
                            <option value="Suspensión">Suspensión</option>
                            <option value="Transmisión">Transmisión</option>
                            <option value="Electricidad">Electricidad</option>
                            <option value="Carrocería">Carrocería</option>
                            <option value="Aceites">Aceites</option>
                            <option value="Filtros">Filtros</option>
                            <option value="Refrigeración">Refrigeración</option>
                            <option value="Escapes">Escapes</option>
                            <option value="Neumáticos">Neumáticos</option>
                            <option value="Baterías">Baterías</option>
                            <option value="Otros">Otros</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="numero_pieza">Número de Pieza</label>
                        <input type="text" id="numero_pieza" name="numero_pieza" 
                               placeholder="Número original">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="cantidad">Cantidad *</label>
                        <input type="number" id="cantidad" name="cantidad" 
                               min="0" step="1" required value="0">
                    </div>
                    
                    <div class="form-group">
                        <label for="costo">Costo Unitario ($) *</label>
                        <input type="number" id="costo" name="costo" 
                               min="0" step="100" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="descripcion">Descripción</label>
                    <textarea id="descripcion" name="descripcion" 
                              rows="3" placeholder="Descripción detallada..."></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="inventario_id">Ubicación en Inventario</label>
                        <select id="inventario_id" name="inventario_id">
                            <option value="">Sin ubicación</option>
                            <!-- Se cargará dinámicamente -->
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="stock_minimo">Stock Mínimo</label>
                        <input type="number" id="stock_minimo" name="stock_minimo" 
                            min="0" value="5" placeholder="5">
                        <small>Alerta cuando baje de esta cantidad (Valor por defecto: 5)</small>
                    </div>
                </div>
                
                <div class="form-buttons">
                    <button type="button" class="btn-secondary" onclick="cerrarModal()">
                        Cancelar
                    </button>
                    <button type="submit" class="btn-primary">
                        <i class="fas fa-save"></i> Guardar
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal para ajustar stock -->
    <div id="modal-ajuste" class="modal" style="display: none;">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Ajustar Stock</h2>
                <button class="btn-close" onclick="cerrarModalAjuste()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <div class="repuesto-info">
                    <h3 id="ajuste-nombre"></h3>
                    <p>Código: <strong id="ajuste-codigo"></strong></p>
                    <p>Stock actual: <strong id="ajuste-stock"></strong></p>
                </div>
                
                <div class="form-group">
                    <label for="tipo-ajuste">Tipo de Ajuste</label>
                    <select id="tipo-ajuste" onchange="cambiarTipoAjuste()">
                        <option value="entrada">Entrada (Aumentar)</option>
                        <option value="salida">Salida (Disminuir)</option>
                        <option value="ajuste">Ajuste Manual</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="cantidad-ajuste">Cantidad</label>
                    <input type="number" id="cantidad-ajuste" 
                           min="1" value="1" step="1">
                </div>
                
                <div class="form-group">
                    <label for="motivo-ajuste">Motivo</label>
                    <textarea id="motivo-ajuste" rows="3" 
                              placeholder="Ej: Compra, Venta, Ajuste de inventario..."></textarea>
                </div>
                
                <div class="form-group">
                    <label for="costo-ajuste">Costo (opcional)</label>
                    <input type="number" id="costo-ajuste" 
                           min="0" placeholder="Costo unitario si es compra">
                </div>
            </div>
            
            <div class="modal-buttons">
                <button class="btn-secondary" onclick="cerrarModalAjuste()">
                    Cancelar
                </button>
                <button class="btn-primary" onclick="aplicarAjuste()">
                    <i class="fas fa-check"></i> Aplicar Ajuste
                </button>
            </div>
        </div>
    </div>

    <!-- Modal para historial -->
    <div id="modal-historial" class="modal modal-large" style="display: none;">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Historial de Movimientos</h2>
                <button class="btn-close" onclick="cerrarModalHistorial()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <div class="historial-filtros">
                    <input type="text" id="filtro-fecha" placeholder="Filtrar por fecha...">
                    <select id="filtro-tipo">
                        <option value="">Todos los tipos</option>
                        <option value="entrada">Entradas</option>
                        <option value="salida">Salidas</option>
                        <option value="ajuste">Ajustes</option>
                    </select>
                </div>
                
                <table class="historial-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Tipo</th>
                            <th>Cantidad</th>
                            <th>Stock Anterior</th>
                            <th>Stock Nuevo</th>
                            <th>Motivo</th>
                            <th>Usuario</th>
                        </tr>
                    </thead>
                    <tbody id="historial-body">
                        <!-- Historial se cargará aquí -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script src="components/theme-manager.js"></script>
    <script src="scripts/gestion-inventario.js"></script>
</body>
</html>