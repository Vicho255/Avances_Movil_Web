// Variables globales
let inventarioData = [];
let inventarioFiltrado = [];
let inventariosDisponibles = [];
let repuestoSeleccionado = null;
let paginaActual = 1;
const itemsPorPagina = 15;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    cargarInventario();
    cargarInventarios();
    configurarEventListeners();
});

// Configurar event listeners
function configurarEventListeners() {
    // Formulario de repuesto
    const formRepuesto = document.getElementById('form-repuesto');
    if (formRepuesto) {
        formRepuesto.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarRepuesto();
        });
    }
    
    // Autocalcular valor total cuando cambia cantidad o costo
    const cantidadInput = document.getElementById('cantidad');
    const costoInput = document.getElementById('costo');
    
    if (cantidadInput) {
        cantidadInput.addEventListener('input', calcularValorTotal);
    }
    
    if (costoInput) {
        costoInput.addEventListener('input', calcularValorTotal);
    }
    
    // Generar código automático si está vacío
    const nombreInput = document.getElementById('nombre');
    if (nombreInput) {
        nombreInput.addEventListener('blur', function() {
            const codigoInput = document.getElementById('codigo');
            if (codigoInput && !codigoInput.value.trim()) {
                const nombre = this.value.trim();
                if (nombre.length > 0) {
                    // Crear código basado en las primeras 3 letras y timestamp
                    const prefix = nombre.substring(0, 3).toUpperCase();
                    const timestamp = Date.now().toString().slice(-4);
                    codigoInput.value = `PIEZA_${prefix}_${timestamp}`;
                }
            }
        });
    }
}

// Calcular valor total en el formulario
function calcularValorTotal() {
    const cantidad = parseInt(document.getElementById('cantidad')?.value) || 0;
    const costo = parseInt(document.getElementById('costo')?.value) || 0;
    const valorTotal = cantidad * costo;
    
    // Actualizar etiqueta si existe
    const valorTotalElement = document.getElementById('valor-total-form');
    if (valorTotalElement) {
        valorTotalElement.textContent = `$${valorTotal.toLocaleString('es-CL')}`;
    }
}

// ========== FUNCIONES DE CARGA ==========
async function cargarInventario() {
    try {
        mostrarLoading(true);
        
        const response = await fetch('api/inventario-data.php?accion=obtener_inventario');
        const data = await response.json();
        
        if (data.success) {
            inventarioData = data.data;
            inventarioFiltrado = [...inventarioData];
            actualizarEstadisticas();
            mostrarInventario();
            mostrarPaginacion();
        } else {
            throw new Error(data.message || 'Error al cargar inventario');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar inventario: ' + error.message);
        // Mostrar datos de ejemplo para desarrollo
        mostrarDatosEjemplo();
    } finally {
        mostrarLoading(false);
    }
}

async function cargarInventarios() {
    try {
        const response = await fetch('api/inventario-data.php?accion=obtener_inventarios');
        const data = await response.json();
        
        if (data.success) {
            inventariosDisponibles = data.data;
            llenarSelectInventarios();
        }
    } catch (error) {
        console.error('Error cargando inventarios:', error);
        // Crear algunos inventarios por defecto
        inventariosDisponibles = [
            { codigo: 1, espacio: 'Estante A - Motor' },
            { codigo: 2, espacio: 'Estante B - Frenos' },
            { codigo: 3, espacio: 'Estante C - Electricidad' },
            { codigo: 4, espacio: 'Estante D - Carrocería' },
            { codigo: 5, espacio: 'Estante E - Aceites y Filtros' },
            { codigo: 6, espacio: 'Estante F - Suspensión' },
            { codigo: 7, espacio: 'Estante G - Transmisión' },
            { codigo: 8, espacio: 'Estante H - Varios' }
        ];
        llenarSelectInventarios();
    }
}

function llenarSelectInventarios() {
    const select = document.getElementById('inventario_id');
    if (!select) return;
    
    select.innerHTML = '<option value="">Sin ubicación</option>';
    
    inventariosDisponibles.forEach(inv => {
        const option = document.createElement('option');
        option.value = inv.codigo;
        option.textContent = `${inv.espacio} (ID: ${inv.codigo})`;
        select.appendChild(option);
    });
}

// ========== MOSTRAR INVENTARIO ==========
function mostrarInventario() {
    const tbody = document.getElementById('inventario-body');
    const noResults = document.getElementById('no-results');
    
    if (!tbody) return;
    
    if (inventarioFiltrado.length === 0) {
        if (noResults) noResults.style.display = 'block';
        tbody.innerHTML = '';
        return;
    }
    
    if (noResults) noResults.style.display = 'none';
    
    // Calcular índices para paginación
    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const itemsPagina = inventarioFiltrado.slice(inicio, fin);
    
    tbody.innerHTML = itemsPagina.map(repuesto => {
        const valorTotal = (repuesto.cantidad || 0) * (repuesto.costo || 0);
        
        // CORRECCIÓN: Definir variables aquí dentro del map
        const stockMinimo = repuesto.stock_minimo || 5;
        const stockBajo = repuesto.cantidad < stockMinimo;
        const sinStock = repuesto.cantidad === 0;
        
        let stockClass = '';
        let stockIcon = '';
        
        if (sinStock) {
            stockClass = 'sin-stock';
            stockIcon = '<i class="fas fa-times-circle" style="color: #f44336;"></i>';
        } else if (stockBajo) {
            stockClass = 'stock-bajo';
            stockIcon = '<i class="fas fa-exclamation-triangle" style="color: #ff9800;"></i>';
        } else {
            stockClass = 'stock-normal';
            stockIcon = '<i class="fas fa-check-circle" style="color: #4caf50;"></i>';
        }
        
        // Obtener nombre del inventario
        const inventarioNombre = inventariosDisponibles.find(inv => inv.codigo == repuesto.inventario_id)?.espacio || 'Sin ubicación';
        
        return `
            <tr class="${stockClass}" data-id="${repuesto.codigo}">
                <td><strong>${repuesto.codigo}</strong></td>
                <td>
                    <div class="repuesto-nombre">
                        <strong>${repuesto.nombre}</strong>
                        ${repuesto.descripcion ? `<small>${repuesto.descripcion}</small>` : ''}
                    </div>
                </td>
                <td>
                    <span class="badge-categoria">${repuesto.categoria || 'Sin categoría'}</span>
                </td>
                <td>
                    <div class="stock-info">
                        ${stockIcon}
                        <span class="stock-cantidad ${stockClass}">${repuesto.cantidad}</span>
                        <small>Mín: ${stockMinimo}</small>
                    </div>
                </td>
                <td>$${(repuesto.costo || 0).toLocaleString('es-CL')}</td>
                <td>$${valorTotal.toLocaleString('es-CL')}</td>
                <td>${repuesto.numero_pieza || '-'}</td>
                <td>${inventarioNombre}</td>
                <td>
                    <div class="acciones">
                        <button class="btn-accion btn-editar" onclick="editarRepuesto('${repuesto.codigo}')" 
                                title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-accion btn-ajuste" onclick="mostrarModalAjuste('${repuesto.codigo}')"
                                title="Ajustar stock">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                        <button class="btn-accion btn-historial" onclick="verHistorial('${repuesto.codigo}')"
                                title="Ver historial">
                            <i class="fas fa-history"></i>
                        </button>
                        <button class="btn-accion btn-eliminar" onclick="eliminarRepuesto('${repuesto.codigo}')"
                                title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ========== FILTRADO Y BÚSQUEDA ==========
function filtrarInventario() {
    const busqueda = document.getElementById('buscar-repuesto')?.value.toLowerCase() || '';
    const categoria = document.getElementById('filtro-categoria')?.value || '';
    const estado = document.getElementById('filtro-estado')?.value || '';
    
    inventarioFiltrado = inventarioData.filter(repuesto => {
        // Filtrar por búsqueda
        const coincideBusqueda = !busqueda || 
            repuesto.nombre.toLowerCase().includes(busqueda) ||
            repuesto.codigo.toLowerCase().includes(busqueda) ||
            (repuesto.numero_pieza && repuesto.numero_pieza.toLowerCase().includes(busqueda)) ||
            (repuesto.descripcion && repuesto.descripcion.toLowerCase().includes(busqueda));
        
        // Filtrar por categoría
        const coincideCategoria = !categoria || repuesto.categoria === categoria;
        
        // Filtrar por estado de stock
        let coincideEstado = true;
        const stockMinimo = repuesto.stock_minimo || 5;
        
        if (estado === 'stock-bajo') {
            coincideEstado = repuesto.cantidad < stockMinimo && repuesto.cantidad > 0;
        } else if (estado === 'stock-normal') {
            coincideEstado = repuesto.cantidad >= stockMinimo;
        } else if (estado === 'sin-stock') {
            coincideEstado = repuesto.cantidad === 0;
        }
        
        return coincideBusqueda && coincideCategoria && coincideEstado;
    });
    
    paginaActual = 1;
    mostrarInventario();
    mostrarPaginacion();
}

function limpiarFiltros() {
    const buscarInput = document.getElementById('buscar-repuesto');
    const categoriaSelect = document.getElementById('filtro-categoria');
    const estadoSelect = document.getElementById('filtro-estado');
    
    if (buscarInput) buscarInput.value = '';
    if (categoriaSelect) categoriaSelect.value = '';
    if (estadoSelect) estadoSelect.value = '';
    
    filtrarInventario();
}

// ========== PAGINACIÓN ==========
function mostrarPaginacion() {
    const paginacion = document.getElementById('paginacion');
    const paginaInfo = document.getElementById('pagina-info');
    
    if (!paginacion || !paginaInfo) return;
    
    const totalPaginas = Math.ceil(inventarioFiltrado.length / itemsPorPagina);
    
    if (totalPaginas > 1) {
        paginacion.style.display = 'flex';
        paginaInfo.textContent = `Página ${paginaActual} de ${totalPaginas}`;
    } else {
        paginacion.style.display = 'none';
    }
}

function cambiarPagina(direccion) {
    const totalPaginas = Math.ceil(inventarioFiltrado.length / itemsPorPagina);
    const nuevaPagina = paginaActual + direccion;
    
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
        paginaActual = nuevaPagina;
        mostrarInventario();
        mostrarPaginacion();
        
        // Scroll suave hacia la tabla
        const tableContainer = document.querySelector('.table-container');
        if (tableContainer) {
            tableContainer.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
}

// ========== ESTADÍSTICAS ==========
function actualizarEstadisticas() {
    let totalRepuestos = inventarioData.length;
    let valorTotal = 0;
    let stockBajo = 0;
    let sinStock = 0;
    
    inventarioData.forEach(repuesto => {
        valorTotal += (repuesto.cantidad || 0) * (repuesto.costo || 0);
        
        const stockMinimo = repuesto.stock_minimo || 5;
        
        if (repuesto.cantidad === 0) {
            sinStock++;
        } else if (repuesto.cantidad < stockMinimo) {
            stockBajo++;
        }
    });
    
    // Actualizar elementos solo si existen
    const totalElement = document.getElementById('total-repuestos');
    const valorElement = document.getElementById('valor-total');
    const bajoElement = document.getElementById('stock-bajo');
    const sinStockElement = document.getElementById('sin-stock');
    
    if (totalElement) totalElement.textContent = totalRepuestos.toLocaleString('es-CL');
    if (valorElement) valorElement.textContent = `$${valorTotal.toLocaleString('es-CL')}`;
    if (bajoElement) bajoElement.textContent = stockBajo.toLocaleString('es-CL');
    if (sinStockElement) sinStockElement.textContent = sinStock.toLocaleString('es-CL');
}

// ========== CRUD REPUESTOS ==========
function mostrarModalAgregar() {
    const modal = document.getElementById('modal-repuesto');
    const modalTitulo = document.getElementById('modal-titulo');
    const form = document.getElementById('form-repuesto');
    
    if (!modal || !modalTitulo || !form) return;
    
    modalTitulo.textContent = 'Nuevo Repuesto';
    form.reset();
    
    const repuestoId = document.getElementById('repuesto-id');
    if (repuestoId) repuestoId.value = '';
    
    const codigoInput = document.getElementById('codigo');
    if (codigoInput) codigoInput.value = '';
    
    const stockMinimoInput = document.getElementById('stock_minimo');
    if (stockMinimoInput) stockMinimoInput.value = 5;
    
    modal.style.display = 'flex';
    
    // Agregar campo para mostrar valor total si no existe
    const costoGroup = document.querySelector('#costo')?.closest('.form-group');
    if (costoGroup && !document.getElementById('valor-total-form')) {
        const valorTotalDiv = document.createElement('div');
        valorTotalDiv.id = 'valor-total-form';
        valorTotalDiv.className = 'valor-total-form';
        valorTotalDiv.innerHTML = '<strong>Valor total:</strong> $0';
        costoGroup.parentNode.appendChild(valorTotalDiv);
    }
    
    calcularValorTotal();
}

async function editarRepuesto(codigo) {
    try {
        const response = await fetch(`api/inventario-data.php?accion=obtener_repuesto&codigo=${codigo}`);
        const data = await response.json();
        
        if (data.success) {
            const repuesto = data.data;
            repuestoSeleccionado = repuesto;
            
            const modalTitulo = document.getElementById('modal-titulo');
            if (modalTitulo) modalTitulo.textContent = 'Editar Repuesto';
            
            // Llenar formulario
            const repuestoId = document.getElementById('repuesto-id');
            const codigoInput = document.getElementById('codigo');
            const nombreInput = document.getElementById('nombre');
            const categoriaSelect = document.getElementById('categoria');
            const numeroPiezaInput = document.getElementById('numero_pieza');
            const cantidadInput = document.getElementById('cantidad');
            const costoInput = document.getElementById('costo');
            const descripcionInput = document.getElementById('descripcion');
            const inventarioSelect = document.getElementById('inventario_id');
            const stockMinimoInput = document.getElementById('stock_minimo');
            
            if (repuestoId) repuestoId.value = repuesto.codigo;
            if (codigoInput) codigoInput.value = repuesto.codigo;
            if (nombreInput) nombreInput.value = repuesto.nombre;
            if (categoriaSelect) categoriaSelect.value = repuesto.categoria || '';
            if (numeroPiezaInput) numeroPiezaInput.value = repuesto.numero_pieza || '';
            if (cantidadInput) cantidadInput.value = repuesto.cantidad || 0;
            if (costoInput) costoInput.value = repuesto.costo || 0;
            if (descripcionInput) descripcionInput.value = repuesto.descripcion || '';
            if (inventarioSelect) inventarioSelect.value = repuesto.inventario_id || '';
            if (stockMinimoInput) stockMinimoInput.value = repuesto.stock_minimo || 5;
            
            // Actualizar valor total
            calcularValorTotal();
            
            const modal = document.getElementById('modal-repuesto');
            if (modal) modal.style.display = 'flex';
        } else {
            throw new Error(data.message || 'Error al cargar repuesto');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar repuesto: ' + error.message);
    }
}

async function guardarRepuesto() {
    const form = document.getElementById('form-repuesto');
    if (!form) return;
    
    const formData = new FormData(form);
    const esNuevo = !formData.get('repuesto-id');
    
    const repuestoData = {
        codigo: formData.get('codigo'),
        nombre: formData.get('nombre'),
        categoria: formData.get('categoria'),
        numero_pieza: formData.get('numero_pieza'),
        cantidad: parseInt(formData.get('cantidad')) || 0,
        costo: parseInt(formData.get('costo')) || 0,
        descripcion: formData.get('descripcion'),
        inventario_id: formData.get('inventario_id') || null
        // Nota: stock_minimo no se envía porque no existe en la tabla
    };
    
    // Validaciones
    if (!repuestoData.codigo || !repuestoData.nombre || !repuestoData.categoria) {
        mostrarError('Código, nombre y categoría son requeridos');
        return;
    }
    
    if (repuestoData.cantidad < 0) {
        mostrarError('La cantidad no puede ser negativa');
        return;
    }
    
    if (repuestoData.costo < 0) {
        mostrarError('El costo no puede ser negativo');
        return;
    }
    
    try {
        const response = await fetch('api/inventario-data.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                accion: esNuevo ? 'crear_repuesto' : 'actualizar_repuesto',
                ...repuestoData
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarExito(esNuevo ? 'Repuesto creado exitosamente' : 'Repuesto actualizado exitosamente');
            cerrarModal();
            cargarInventario();
        } else {
            throw new Error(data.message || 'Error al guardar repuesto');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al guardar repuesto: ' + error.message);
    }
}

async function eliminarRepuesto(codigo) {
    const repuesto = inventarioData.find(r => r.codigo === codigo);
    if (!repuesto) return;
    
    if (!confirm(`¿Está seguro de eliminar el repuesto "${repuesto.nombre}" (${codigo})?\n\nEsta acción no se puede deshacer.`)) {
        return;
    }
    
    try {
        const response = await fetch('api/inventario-data.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                accion: 'eliminar_repuesto',
                codigo: codigo
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarExito('Repuesto eliminado exitosamente');
            cargarInventario();
        } else {
            throw new Error(data.message || 'Error al eliminar repuesto');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al eliminar repuesto: ' + error.message);
    }
}

// ========== AJUSTES DE STOCK ==========
async function mostrarModalAjuste(codigo) {
    const repuesto = inventarioData.find(r => r.codigo === codigo);
    if (!repuesto) return;
    
    repuestoSeleccionado = repuesto;
    
    const ajusteNombre = document.getElementById('ajuste-nombre');
    const ajusteCodigo = document.getElementById('ajuste-codigo');
    const ajusteStock = document.getElementById('ajuste-stock');
    
    if (ajusteNombre) ajusteNombre.textContent = repuesto.nombre;
    if (ajusteCodigo) ajusteCodigo.textContent = repuesto.codigo;
    if (ajusteStock) ajusteStock.textContent = repuesto.cantidad;
    
    // Establecer valor mínimo según tipo
    const cantidadInput = document.getElementById('cantidad-ajuste');
    if (cantidadInput) {
        cantidadInput.min = 1;
        cantidadInput.value = 1;
    }
    
    // Limpiar campos
    const motivoInput = document.getElementById('motivo-ajuste');
    const costoInput = document.getElementById('costo-ajuste');
    
    if (motivoInput) motivoInput.value = '';
    if (costoInput) costoInput.value = '';
    
    const modal = document.getElementById('modal-ajuste');
    if (modal) modal.style.display = 'flex';
}

function cambiarTipoAjuste() {
    const tipoSelect = document.getElementById('tipo-ajuste');
    const cantidadInput = document.getElementById('cantidad-ajuste');
    const costoInput = document.getElementById('costo-ajuste');
    
    if (!tipoSelect || !cantidadInput || !repuestoSeleccionado) return;
    
    const tipo = tipoSelect.value;
    
    if (tipo === 'ajuste') {
        cantidadInput.min = 0;
        cantidadInput.placeholder = 'Nuevo stock total';
        cantidadInput.value = repuestoSeleccionado.cantidad;
        if (costoInput) costoInput.placeholder = 'Nuevo costo (opcional)';
    } else {
        cantidadInput.min = 1;
        cantidadInput.placeholder = 'Cantidad a ajustar';
        cantidadInput.value = 1;
        if (costoInput) {
            if (tipo === 'entrada') {
                costoInput.placeholder = 'Costo de compra (opcional)';
            } else {
                costoInput.placeholder = 'Costo unitario (opcional)';
            }
        }
    }
}

async function aplicarAjuste() {
    const tipoSelect = document.getElementById('tipo-ajuste');
    const cantidadInput = document.getElementById('cantidad-ajuste');
    const motivoInput = document.getElementById('motivo-ajuste');
    const costoInput = document.getElementById('costo-ajuste');
    
    if (!tipoSelect || !cantidadInput || !motivoInput || !repuestoSeleccionado) return;
    
    const tipo = tipoSelect.value;
    const cantidad = parseInt(cantidadInput.value) || 0;
    const motivo = motivoInput.value;
    const costo = costoInput ? parseInt(costoInput.value) || null : null;
    
    if (cantidad < 0) {
        mostrarError('La cantidad no puede ser negativa');
        return;
    }
    
    if (!motivo.trim()) {
        mostrarError('Debe especificar un motivo');
        return;
    }
    
    let nuevaCantidad = repuestoSeleccionado.cantidad;
    let cantidadMovimiento = cantidad;
    
    switch (tipo) {
        case 'entrada':
            nuevaCantidad += cantidad;
            break;
        case 'salida':
            if (cantidad > repuestoSeleccionado.cantidad) {
                mostrarError('No hay suficiente stock para esta salida');
                return;
            }
            nuevaCantidad -= cantidad;
            break;
        case 'ajuste':
            cantidadMovimiento = Math.abs(nuevaCantidad - cantidad);
            nuevaCantidad = cantidad;
            break;
    }
    
    if (nuevaCantidad < 0) {
        mostrarError('El stock no puede ser negativo');
        return;
    }
    
    try {
        const response = await fetch('api/inventario-data.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                accion: 'ajustar_stock',
                codigo: repuestoSeleccionado.codigo,
                cantidad: nuevaCantidad,
                tipo: tipo,
                cantidad_movimiento: cantidadMovimiento,
                motivo: motivo,
                costo: costo || '',
                stock_anterior: repuestoSeleccionado.cantidad
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarExito('Stock ajustado exitosamente');
            cerrarModalAjuste();
            cargarInventario();
        } else {
            throw new Error(data.message || 'Error al ajustar stock');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al ajustar stock: ' + error.message);
    }
}

// ========== HISTORIAL ==========
async function verHistorial(codigo) {
    try {
        const response = await fetch(`api/inventario-data.php?accion=obtener_historial&codigo=${codigo}`);
        const data = await response.json();
        
        if (data.success) {
            const repuesto = inventarioData.find(r => r.codigo === codigo);
            const modalTitle = document.querySelector('#modal-historial h2');
            if (modalTitle && repuesto) {
                modalTitle.textContent = `Historial: ${repuesto.nombre} (${codigo})`;
            }
            
            mostrarHistorial(data.data);
            const modal = document.getElementById('modal-historial');
            if (modal) modal.style.display = 'flex';
        } else {
            throw new Error(data.message || 'Error al cargar historial');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar historial: ' + error.message);
    }
}

function mostrarHistorial(movimientos) {
    const tbody = document.getElementById('historial-body');
    if (!tbody) return;
    
    if (!movimientos || movimientos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    No hay movimientos registrados
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = movimientos.map(mov => {
        let tipoClass = '';
        let tipoIcon = '';
        let tipoTexto = '';
        
        switch (mov.tipo) {
            case 'entrada':
                tipoClass = 'tipo-entrada';
                tipoIcon = '<i class="fas fa-arrow-down"></i>';
                tipoTexto = 'Entrada';
                break;
            case 'salida':
                tipoClass = 'tipo-salida';
                tipoIcon = '<i class="fas fa-arrow-up"></i>';
                tipoTexto = 'Salida';
                break;
            case 'ajuste':
                tipoClass = 'tipo-ajuste';
                tipoIcon = '<i class="fas fa-exchange-alt"></i>';
                tipoTexto = 'Ajuste';
                break;
            default:
                tipoClass = 'tipo-otro';
                tipoIcon = '<i class="fas fa-question"></i>';
                tipoTexto = mov.tipo || 'Otro';
        }
        
        // Formatear fecha
        const fecha = new Date(mov.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-CL') + ' ' + fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
        
        return `
            <tr>
                <td>${fechaFormateada}</td>
                <td>
                    <span class="badge-tipo ${tipoClass}">
                        ${tipoIcon} ${tipoTexto}
                    </span>
                </td>
                <td>${mov.cantidad}</td>
                <td>${mov.stock_anterior}</td>
                <td>${mov.stock_nuevo}</td>
                <td>${mov.motivo || '-'}</td>
                <td>${mov.usuario || 'Sistema'}</td>
            </tr>
        `;
    }).join('');
}

// ========== REPORTES ==========
async function generarReporte() {
    try {
        // Mostrar indicador de carga
        const btn = document.querySelector('.btn-info');
        if (!btn) return;
        
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
        btn.disabled = true;
        
        const response = await fetch('api/inventario-data.php?accion=generar_reporte');
        const data = await response.json();
        
        // Restaurar botón
        btn.innerHTML = originalHtml;
        btn.disabled = false;
        
        if (data.success) {
            descargarReportePDF(data.data);
        } else {
            throw new Error(data.message || 'Error al generar reporte');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al generar reporte: ' + error.message);
        
        // Restaurar botón en caso de error
        const btn = document.querySelector('.btn-info');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-chart-bar"></i> Reporte';
            btn.disabled = false;
        }
    }
}

function descargarReportePDF(datosReporte) {
    // Verificar si jsPDF está disponible
    if (typeof window.jspdf === 'undefined') {
        mostrarError('La librería jsPDF no está cargada. Recarga la página.');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Encabezado
    doc.setFontSize(20);
    doc.text('REPORTE DE INVENTARIO', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('MiAutomotriz', 105, 30, { align: 'center' });
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, 105, 35, { align: 'center' });
    
    let y = 50;
    
    // Estadísticas
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('ESTADÍSTICAS GENERALES', 20, y);
    y += 10;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Total de repuestos: ${datosReporte.total_repuestos}`, 25, y);
    y += 7;
    doc.text(`Valor total del inventario: $${datosReporte.valor_total.toLocaleString('es-CL')}`, 25, y);
    y += 7;
    doc.text(`Repuestos con stock bajo: ${datosReporte.stock_bajo}`, 25, y);
    y += 7;
    doc.text(`Repuestos sin stock: ${datosReporte.sin_stock}`, 25, y);
    
    y += 15;
    
    // Repuestos con stock bajo
    if (datosReporte.stock_bajo_lista.length > 0) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('REPUESTOS CON STOCK BAJO', 20, y);
        y += 5;
        
        const tablaStockBajo = datosReporte.stock_bajo_lista.map(item => [
            item.codigo,
            item.nombre.substring(0, 30),
            item.cantidad.toString(),
            `$${item.costo.toLocaleString('es-CL')}`,
            `$${(item.cantidad * item.costo).toLocaleString('es-CL')}`
        ]);
        
        doc.autoTable({
            startY: y,
            head: [['Código', 'Nombre', 'Stock', 'Costo', 'Valor']],
            body: tablaStockBajo,
            theme: 'grid',
            headStyles: { fillColor: [255, 152, 0] }
        });
        
        y = doc.lastAutoTable.finalY + 10;
    }
    
    // Repuestos sin stock
    if (datosReporte.sin_stock_lista.length > 0) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('REPUESTOS SIN STOCK', 20, y);
        y += 5;
        
        const tablaSinStock = datosReporte.sin_stock_lista.map(item => [
            item.codigo,
            item.nombre.substring(0, 35),
            `$${item.costo.toLocaleString('es-CL')}`
        ]);
        
        doc.autoTable({
            startY: y,
            head: [['Código', 'Nombre', 'Costo']],
            body: tablaSinStock,
            theme: 'grid',
            headStyles: { fillColor: [244, 67, 54] }
        });
        
        y = doc.lastAutoTable.finalY + 10;
    }
    
    // Repuestos más valiosos
    if (datosReporte.mas_valiosos.length > 0) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('REPUESTOS MÁS VALIOSOS', 20, y);
        y += 5;
        
        const tablaValiosos = datosReporte.mas_valiosos.map(item => [
            item.codigo,
            item.nombre.substring(0, 25),
            item.cantidad.toString(),
            `$${item.costo.toLocaleString('es-CL')}`,
            `$${item.valor_total.toLocaleString('es-CL')}`
        ]);
        
        doc.autoTable({
            startY: y,
            head: [['Código', 'Nombre', 'Stock', 'Costo', 'Valor Total']],
            body: tablaValiosos,
            theme: 'grid',
            headStyles: { fillColor: [33, 150, 243] }
        });
    }
    
    // Pie de página
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Página ${i} de ${totalPages}`, 105, 285, { align: 'center' });
        doc.text('Reporte generado por Sistema de Inventario MiAutomotriz', 105, 290, { align: 'center' });
    }
    
    // Guardar PDF
    const fileName = `Reporte_Inventario_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
}

// ========== FUNCIONES AUXILIARES ==========
function cerrarModal() {
    const modal = document.getElementById('modal-repuesto');
    const form = document.getElementById('form-repuesto');
    
    if (modal) modal.style.display = 'none';
    if (form) form.reset();
}

function cerrarModalAjuste() {
    const modal = document.getElementById('modal-ajuste');
    if (modal) modal.style.display = 'none';
    repuestoSeleccionado = null;
}

function cerrarModalHistorial() {
    const modal = document.getElementById('modal-historial');
    if (modal) modal.style.display = 'none';
}

function mostrarLoading(mostrar) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = mostrar ? 'flex' : 'none';
    }
}

function mostrarError(mensaje) {
    // Puedes usar SweetAlert2 para mejores notificaciones
    // Por ahora usamos alert nativo
    alert('❌ ' + mensaje);
}

function mostrarExito(mensaje) {
    alert('✅ ' + mensaje);
}

// Datos de ejemplo para desarrollo
function mostrarDatosEjemplo() {
    inventarioData = [
        {
            codigo: 'FILTRO_ACE001',
            nombre: 'Filtro de Aceite Original',
            categoria: 'Filtros',
            cantidad: 12,
            costo: 8500,
            descripcion: 'Filtro de aceite para motor 1.6L, marca original',
            numero_pieza: 'FO-1234-567',
            inventario_id: 5,
            stock_minimo: 5
        },
        {
            codigo: 'PAST_FRE002',
            nombre: 'Pastillas de Freno Delanteras',
            categoria: 'Frenos',
            cantidad: 3,
            costo: 25000,
            descripcion: 'Pastillas de freno delanteras para sedán mediano',
            numero_pieza: 'PFD-2023-01',
            inventario_id: 2,
            stock_minimo: 4
        },
        {
            codigo: 'BAT_AUT003',
            nombre: 'Batería Automotriz 60Ah',
            categoria: 'Baterías',
            cantidad: 0,
            costo: 120000,
            descripcion: 'Batería automotriz 60 amperios, 12V',
            numero_pieza: 'BT-60AH-12V',
            inventario_id: 3,
            stock_minimo: 2
        },
        {
            codigo: 'ACE_SYN004',
            nombre: 'Aceite Sintético 5W30',
            categoria: 'Aceites',
            cantidad: 24,
            costo: 15000,
            descripcion: 'Aceite sintético 5W30 1L, protección del motor',
            numero_pieza: 'AS-5W30-1L',
            inventario_id: 5,
            stock_minimo: 10
        },
        {
            codigo: 'BUJ_IRI005',
            nombre: 'Bujías de Iridio',
            categoria: 'Motor',
            cantidad: 8,
            costo: 12000,
            descripcion: 'Bujías de iridio, mejor rendimiento de combustible',
            numero_pieza: 'BI-4CIL',
            inventario_id: 1,
            stock_minimo: 6
        }
    ];
    
    inventarioFiltrado = [...inventarioData];
    actualizarEstadisticas();
    mostrarInventario();
    mostrarPaginacion();
    
    console.log('Mostrando datos de ejemplo para desarrollo');
}