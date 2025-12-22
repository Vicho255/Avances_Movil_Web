// Gestión de órdenes de trabajo - JavaScript puro
document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    window.ordenesPaginacion = {
        pagina: 1,
        porPagina: 10,
        total: 0,
        totalPaginas: 0
    };
    
    window.clientes = [];
    window.vehiculos = [];
    window.trabajadores = [];
    window.averiasDisponibles = [];
    window.repuestosDisponibles = [];
    
    // Cargar datos iniciales
    cargarClientes();
    cargarVehiculos();
    cargarTrabajadores();
    cargarAverias();
    cargarRepuestos();
    cargarOrdenes();
    
    // Configurar eventos del formulario
    const formNuevaOrden = document.getElementById('form-nueva-orden');
    if (formNuevaOrden) {
        formNuevaOrden.addEventListener('submit', function(e) {
            e.preventDefault();
            crearOrden();
        });
    }
    
    // Eventos de búsqueda
    document.addEventListener('click', function(e) {
        // Cerrar dropdowns al hacer clic fuera
        if (!e.target.closest('.search-wrapper')) {
            cerrarDropdowns();
        }
    });
});

// Funciones de utilidad
function mostrarError(mensaje) {
    alert('Error: ' + mensaje);
}

function mostrarExito(mensaje) {
    alert('Éxito: ' + mensaje);
}

function cerrarDropdowns() {
    const dropdowns = document.querySelectorAll('.search-dropdown');
    dropdowns.forEach(dropdown => {
        dropdown.style.display = 'none';
    });
}

function parsearRespuestaJSON(texto) {
    try {
        // Limpiar el texto de posibles errores HTML
        const textoLimpio = texto.trim();
        
        // Verificar si el texto comienza con HTML (error de PHP)
        if (textoLimpio.startsWith('<')) {
            console.error('Respuesta contiene HTML en lugar de JSON:', textoLimpio.substring(0, 200));
            
            // Extraer mensaje de error si es posible
            const errorMatch = textoLimpio.match(/<b>(.*?)<\/b>/);
            const errorMsg = errorMatch ? errorMatch[1] : 'Error del servidor (HTML)';
            
            return { error: errorMsg, raw: textoLimpio.substring(0, 500) };
        }
        
        // Intentar parsear como JSON
        const data = JSON.parse(textoLimpio);
        return data;
        
    } catch (error) {
        console.error('Error parseando JSON:', error.message);
        console.error('Texto recibido:', texto.substring(0, 500));
        
        // Si el texto parece ser JSON pero no se puede parsear
        if (texto.includes('{') && texto.includes('}')) {
            // Intentar arreglar JSON malformado
            try {
                const fixedJson = texto.replace(/[\u0000-\u0019]+/g, "");
                return JSON.parse(fixedJson);
            } catch (e) {
                // Si no se puede arreglar, devolver error
                return { 
                    error: 'JSON inválido: ' + error.message,
                    raw: texto.substring(0, 500)
                };
            }
        }
        
        return { 
            error: 'Respuesta inválida del servidor: ' + error.message,
            raw: texto.substring(0, 500)
        };
    }
}

async function cargarVehiculos() {
    try {
        const response = await fetch('api/ordenes-data.php?accion=obtener_vehiculos');
        const texto = await response.text();
        const data = parsearRespuestaJSON(texto);
        
        if (data.error) {
            mostrarError(data.error);
            return;
        }
        
        if (Array.isArray(data)) {
            window.vehiculos = data;
        } else {
            window.vehiculos = [];
        }
    } catch (error) {
        mostrarError('Error al cargar vehículos: ' + error.message);
    }
}

    async function cargarClientes() {
        try {
            const response = await fetch('api/ordenes-data.php?accion=obtener_clientes');
            const texto = await response.text();
            const data = parsearRespuestaJSON(texto);
            
            if (data.error) {
                mostrarError(data.error);
                return;
            }
            
            if (Array.isArray(data)) {
                window.clientes = data;
            } else {
                window.clientes = [];
            }
            
            console.log('Clientes cargados:', window.clientes.length);
        } catch (error) {
            mostrarError('Error al cargar clientes: ' + error.message);
            // Usar datos de prueba si falla
            window.clientes = [
                {rut: '11111111-1', nombre_completo: 'Juan Pérez'},
                {rut: '22222222-2', nombre_completo: 'María González'},
                {rut: '33333333-3', nombre_completo: 'Carlos López'}
            ];
            console.log('Usando datos de prueba para clientes');
        }
    }

async function cargarTrabajadores() {
    try {
        const response = await fetch('api/ordenes-data.php?accion=obtener_trabajadores');
        const texto = await response.text();
        const data = parsearRespuestaJSON(texto);
        
        if (data.error) {
            mostrarError(data.error);
            return;
        }
        
        if (Array.isArray(data)) {
            window.trabajadores = data;
            actualizarDropdownTrabajadores();
        }
    } catch (error) {
        mostrarError('Error al cargar trabajadores: ' + error.message);
    }
}

function actualizarDropdownTrabajadores() {
    const selectTrabajador = document.getElementById('trabajador-rut');
    const selectFiltroTrabajador = document.getElementById('filtro-trabajador');
    
    if (selectTrabajador && window.trabajadores.length > 0) {
        selectTrabajador.innerHTML = '<option value="">Seleccionar trabajador...</option>';
        window.trabajadores.forEach(trabajador => {
            const option = document.createElement('option');
            option.value = trabajador.rut;
            option.textContent = trabajador.nombre_completo;
            selectTrabajador.appendChild(option);
        });
    }
    
    if (selectFiltroTrabajador && window.trabajadores.length > 0) {
        selectFiltroTrabajador.innerHTML = '<option value="">Todos los trabajadores</option>';
        window.trabajadores.forEach(trabajador => {
            const option = document.createElement('option');
            option.value = trabajador.rut;
            option.textContent = trabajador.nombre_completo;
            selectFiltroTrabajador.appendChild(option);
        });
    }
}

async function cargarAverias() {
    try {
        const response = await fetch('api/ordenes-data.php?accion=obtener_averias');
        const texto = await response.text();
        const data = parsearRespuestaJSON(texto);
        
        if (data.error) {
            mostrarError(data.error);
            return;
        }
        
        if (Array.isArray(data)) {
            window.averiasDisponibles = data;
        } else {
            window.averiasDisponibles = [];
        }
    } catch (error) {
        mostrarError('Error al cargar averías: ' + error.message);
    }
}

async function cargarRepuestos() {
    try {
        const response = await fetch('api/ordenes-data.php?accion=obtener_repuestos');
        const texto = await response.text();
        const data = parsearRespuestaJSON(texto);
        
        if (data.error) {
            mostrarError(data.error);
            return;
        }
        
        if (Array.isArray(data)) {
            window.repuestosDisponibles = data;
        } else {
            window.repuestosDisponibles = [];
        }
    } catch (error) {
        mostrarError('Error al cargar repuestos: ' + error.message);
    }
}

// Funciones de búsqueda
function filtrarClientes(termino) {
    const dropdown = document.getElementById('clientes-dropdown');
    const inputHidden = document.getElementById('cliente-rut');
    const clienteInfo = document.getElementById('cliente-info');
    
    if (!termino.trim()) {
        dropdown.style.display = 'none';
        return;
    }
    
    // Si no hay clientes cargados, intentar cargarlos
    if (window.clientes.length === 0) {
        cargarClientes();
        setTimeout(() => filtrarClientes(termino), 500);
        return;
    }
    
    const filtrados = window.clientes.filter(cliente => {
        const textoBusqueda = `${cliente.nombre_completo} ${cliente.rut}`.toLowerCase();
        return textoBusqueda.includes(termino.toLowerCase());
    });
    
    if (filtrados.length === 0) {
        dropdown.innerHTML = '<div class="search-item">No se encontraron clientes</div>';
        dropdown.style.display = 'block';
        return;
    }
    
    dropdown.innerHTML = '';
    filtrados.forEach(cliente => {
        const item = document.createElement('div');
        item.className = 'search-item';
        item.innerHTML = `
            <div><strong>${cliente.nombre_completo}</strong></div>
            <small>RUT: ${cliente.rut}</small>
        `;
        
        item.addEventListener('click', function() {
            inputHidden.value = cliente.rut;
            document.getElementById('cliente-search').value = `${cliente.nombre_completo} (${cliente.rut})`;
            dropdown.style.display = 'none';
            cargarClienteInfo(cliente.rut);
        });
        
        dropdown.appendChild(item);
    });
    
    dropdown.style.display = 'block';
}

function filtrarVehiculos(termino) {
    const dropdown = document.getElementById('vehiculos-dropdown');
    const inputHidden = document.getElementById('vehiculo-patente');
    const vehiculoInfo = document.getElementById('vehiculo-info');
    
    if (!termino.trim()) {
        dropdown.style.display = 'none';
        return;
    }
    
    // Si no hay vehículos cargados, intentar cargarlos
    if (window.vehiculos.length === 0) {
        cargarVehiculos();
        setTimeout(() => filtrarVehiculos(termino), 500);
        return;
    }
    
    const filtrados = window.vehiculos.filter(vehiculo => {
        const textoBusqueda = `${vehiculo.patente} ${vehiculo.modelo || ''} ${vehiculo.dueno || ''}`.toLowerCase();
        return textoBusqueda.includes(termino.toLowerCase());
    });
    
    if (filtrados.length === 0) {
        dropdown.innerHTML = '<div class="search-item">No se encontraron vehículos</div>';
        dropdown.style.display = 'block';
        return;
    }
    
    dropdown.innerHTML = '';
    filtrados.forEach(vehiculo => {
        const item = document.createElement('div');
        item.className = 'search-item';
        item.innerHTML = `
            <div><strong>${vehiculo.patente}</strong> - ${vehiculo.modelo || 'Sin modelo'}</div>
            <small>Dueño: ${vehiculo.dueno || 'No asignado'}</small>
        `;
        
        item.addEventListener('click', function() {
            inputHidden.value = vehiculo.patente;
            document.getElementById('vehiculo-search').value = `${vehiculo.patente} - ${vehiculo.modelo || 'Sin modelo'}`;
            dropdown.style.display = 'none';
            cargarVehiculoInfo(vehiculo.patente);
        });
        
        dropdown.appendChild(item);
    });
    
    dropdown.style.display = 'block';
}

async function cargarClienteInfo(rut) {
    try {
        const response = await fetch(`api/ordenes-data.php?accion=obtener_cliente_info&rut=${encodeURIComponent(rut)}`);
        const texto = await response.text();
        const data = parsearRespuestaJSON(texto);
        
        if (data.error) {
            document.getElementById('cliente-info').style.display = 'none';
            return;
        }
        
        document.getElementById('cliente-nombre').textContent = (data.nombre || '') + ' ' + (data.apellido || '');
        document.getElementById('cliente-telefono').textContent = data.telefono || 'No registrado';
        document.getElementById('cliente-info').style.display = 'block';
    } catch (error) {
        document.getElementById('cliente-info').style.display = 'none';
    }
}

async function cargarVehiculoInfo(patente) {
    try {
        const response = await fetch(`api/ordenes-data.php?accion=obtener_vehiculo_info&patente=${encodeURIComponent(patente)}`);
        const texto = await response.text();
        const data = parsearRespuestaJSON(texto);
        
        if (data.error) {
            document.getElementById('vehiculo-info').style.display = 'none';
            return;
        }
        
        document.getElementById('vehiculo-modelo').textContent = (data.marca || '') + ' ' + (data.modelo_nombre || 'Sin modelo');
        document.getElementById('vehiculo-color').textContent = data.color || 'No especificado';
        document.getElementById('vehiculo-dueno').textContent = data.dueno_nombre || 'No asignado';
        document.getElementById('vehiculo-info').style.display = 'block';
    } catch (error) {
        document.getElementById('vehiculo-info').style.display = 'none';
    }
}

// Funciones para agregar averías y repuestos
function agregarAveria() {
    const container = document.getElementById('averias-container');
    const count = container.querySelectorAll('.averia-item').length;
    
    if (count >= 10) {
        alert('Máximo 10 averías permitidas');
        return;
    }
    
    const selectOptions = window.averiasDisponibles && window.averiasDisponibles.length > 0
        ? window.averiasDisponibles.map(a => `<option value="${a.codigo}">${a.nombre}</option>`).join('')
        : '<option value="">Cargando averías...</option>';
    
    const html = `
        <div class="averia-item">
            <select name="averias[${count}][id]" required>
                <option value="">Seleccionar avería...</option>
                ${selectOptions}
            </select>
            <input type="text" name="averias[${count}][detalle]" 
                   placeholder="Detalles de la avería..." required>
            <button type="button" class="btn-remove" onclick="removerAveria(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
    actualizarContadorAverias();
}

function agregarRepuesto() {
    const container = document.getElementById('repuestos-container');
    
    const selectOptions = window.repuestosDisponibles && window.repuestosDisponibles.length > 0
        ? window.repuestosDisponibles.map(r => 
            `<option value="${r.codigo}" data-costo="${r.costo}">${r.nombre} - $${r.costo}</option>`
        ).join('')
        : '<option value="">Cargando repuestos...</option>';
    
    const html = `
        <div class="repuesto-item">
            <select name="repuestos[][codigo]" required onchange="actualizarCostoRepuesto(this)">
                <option value="">Seleccionar repuesto...</option>
                ${selectOptions}
            </select>
            <input type="number" name="repuestos[][cantidad]" 
                   placeholder="Cantidad" min="1" required>
            <input type="number" name="repuestos[][costo]" 
                   placeholder="Costo" step="0.01" readonly>
            <button type="button" class="btn-remove" onclick="removerRepuesto(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
}

function removerAveria(btn) {
    btn.closest('.averia-item').remove();
    actualizarContadorAverias();
}

function removerRepuesto(btn) {
    btn.closest('.repuesto-item').remove();
}

function actualizarContadorAverias() {
    const count = document.querySelectorAll('#averias-container .averia-item').length;
    document.getElementById('averias-counter').textContent = `${count}/10 averías`;
}

function actualizarCostoRepuesto(select) {
    const costo = select.selectedOptions[0].dataset.costo || 0;
    const repuestoItem = select.closest('.repuesto-item');
    const inputCosto = repuestoItem.querySelector('input[name$="[costo]"]');
    inputCosto.value = costo;
}

// Crear nueva orden
async function crearOrden() {
    // Validaciones básicas
    const clienteRut = document.getElementById('cliente-rut').value;
    const vehiculoPatente = document.getElementById('vehiculo-patente').value;
    const trabajadorRut = document.getElementById('trabajador-rut').value;
    const descripcion = document.getElementById('descripcion').value;
    
    if (!clienteRut) {
        alert('Debe seleccionar un cliente');
        return;
    }
    
    if (!vehiculoPatente) {
        alert('Debe seleccionar un vehículo');
        return;
    }
    
    if (!trabajadorRut) {
        alert('Debe asignar un trabajador');
        return;
    }
    
    if (!descripcion.trim()) {
        alert('Debe ingresar una descripción');
        return;
    }
    
    // Preparar datos para FormData
    const formData = new FormData(document.getElementById('form-nueva-orden'));
    
    // Convertir FormData a objeto
    const data = {
        accion: 'crear_orden',
        cliente_rut: clienteRut,
        vehiculo_patente: vehiculoPatente,
        descripcion: descripcion,
        trabajador_rut: trabajadorRut
    };
    
    // Agregar averías
    const averiasSelects = document.querySelectorAll('.averia-item select');
    averiasSelects.forEach((select, index) => {
        const detalleInput = select.closest('.averia-item').querySelector('input[type="text"]');
        if (select.value && detalleInput.value.trim()) {
            data[`averias[${index}][id]`] = select.value;
            data[`averias[${index}][detalle]`] = detalleInput.value.trim();
        }
    });
    
    // Agregar repuestos
    const repuestosSelects = document.querySelectorAll('.repuesto-item select');
    repuestosSelects.forEach((select, index) => {
        const cantidadInput = select.closest('.repuesto-item').querySelector('input[type="number"][placeholder="Cantidad"]');
        const costoInput = select.closest('.repuesto-item').querySelector('input[placeholder="Costo"]');
        if (select.value && cantidadInput.value) {
            data[`repuestos[${index}][codigo]`] = select.value;
            data[`repuestos[${index}][cantidad]`] = cantidadInput.value;
            data[`repuestos[${index}][costo]`] = costoInput.value || 0;
        }
    });
    
    // Enviar al servidor
    try {
        const response = await fetch('api/ordenes-data.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(data)
        });
        
        const texto = await response.text();
        const result = parsearRespuestaJSON(texto);
        
        if (result.success) {
            mostrarExito('Orden creada exitosamente con ID: ' + result.orden_id);
            limpiarFormulario();
            cargarOrdenes();
        } else {
            mostrarError(result.error || 'No se pudo crear la orden');
        }
    } catch (error) {
        mostrarError('Error de conexión con el servidor: ' + error.message);
    }
}

// Cargar órdenes activas
async function cargarOrdenes() {
    const filtros = {
        pagina: window.ordenesPaginacion.pagina,
        por_pagina: window.ordenesPaginacion.porPagina,
        estado: document.getElementById('filtro-estado').value,
        trabajador: document.getElementById('filtro-trabajador').value
    };
    
    const params = new URLSearchParams(filtros).toString();
    const ordenesGrid = document.getElementById('ordenes-grid');
    
    ordenesGrid.innerHTML = '<div class="loading">Cargando órdenes de trabajo...</div>';
    
    try {
        const response = await fetch(`api/ordenes-data.php?accion=obtener_ordenes&${params}`);
        const texto = await response.text();
        const data = parsearRespuestaJSON(texto);
        
        if (data.error) {
            ordenesGrid.innerHTML = `<div class="error">Error: ${data.error}</div>`;
            return;
        }
        
        if (data.ordenes && Array.isArray(data.ordenes)) {
            mostrarOrdenes(data.ordenes);
            actualizarPaginacion(data.paginacion);
        } else {
            ordenesGrid.innerHTML = '<div class="no-orders">No hay órdenes de trabajo activas</div>';
        }
    } catch (error) {
        ordenesGrid.innerHTML = `<div class="error">Error al cargar las órdenes: ${error.message}</div>`;
    }
}

function mostrarOrdenes(ordenes) {
    const grid = document.getElementById('ordenes-grid');
    
    if (!ordenes || ordenes.length === 0) {
        grid.innerHTML = '<div class="no-orders">No hay órdenes de trabajo activas</div>';
        return;
    }
    
    let html = '';
    
    ordenes.forEach(orden => {
        const estadoClass = getEstadoClass(orden.estado);
        const fecha = orden.fecha ? new Date(orden.fecha).toLocaleDateString('es-CL') : 'Sin fecha';
        
        html += `
            <div class="orden-card">
                <div class="orden-header">
                    <div class="orden-numero">Orden #${orden.numero}</div>
                    <div class="orden-estado ${estadoClass}">${orden.estado}</div>
                </div>
                <div class="orden-info">
                    <p><strong>Fecha:</strong> ${fecha}</p>
                    <p><strong>Cliente:</strong> ${orden.cliente_nombre || 'No asignado'}</p>
                    <p><strong>Vehículo:</strong> ${orden.patente} (${orden.color})</p>
                    <p><strong>Trabajador:</strong> ${orden.trabajador_nombre || 'No asignado'}</p>
                    <p><strong>Descripción:</strong> ${orden.descripcion ? orden.descripcion.substring(0, 100) + (orden.descripcion.length > 100 ? '...' : '') : 'Sin descripción'}</p>
                </div>
                <div class="orden-acciones">
                    <button class="btn-accion btn-secondary" onclick="verDetallesOrden(${orden.numero})">
                        <i class="fas fa-eye"></i> Ver Detalles
                    </button>
                    <button class="btn-accion btn-primary" onclick="cambiarEstadoOrden(${orden.numero})">
                        <i class="fas fa-edit"></i> Cambiar Estado
                    </button>
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

function actualizarPaginacion(paginacion) {
    if (!paginacion) return;
    
    window.ordenesPaginacion = {
        pagina: paginacion.pagina || 1,
        porPagina: paginacion.por_pagina || 10,
        total: paginacion.total || 0,
        totalPaginas: paginacion.total_paginas || 0
    };
    
    const paginacionElem = document.getElementById('paginacion');
    const paginaInfo = document.getElementById('pagina-info');
    const btnAnterior = document.getElementById('btn-anterior');
    const btnSiguiente = document.getElementById('btn-siguiente');
    
    if (!paginacionElem || !paginaInfo || !btnAnterior || !btnSiguiente) return;
    
    if (window.ordenesPaginacion.totalPaginas <= 1) {
        paginacionElem.style.display = 'none';
        return;
    }
    
    paginaInfo.textContent = `Página ${window.ordenesPaginacion.pagina} de ${window.ordenesPaginacion.totalPaginas}`;
    btnAnterior.disabled = window.ordenesPaginacion.pagina <= 1;
    btnSiguiente.disabled = window.ordenesPaginacion.pagina >= window.ordenesPaginacion.totalPaginas;
    paginacionElem.style.display = 'flex';
}

function cambiarPagina(direccion) {
    const nuevaPagina = window.ordenesPaginacion.pagina + direccion;
    
    if (nuevaPagina < 1 || nuevaPagina > window.ordenesPaginacion.totalPaginas) {
        return;
    }
    
    window.ordenesPaginacion.pagina = nuevaPagina;
    cargarOrdenes();
}

function aplicarFiltros() {
    window.ordenesPaginacion.pagina = 1;
    cargarOrdenes();
}

function getEstadoClass(estado) {
    if (!estado) return '';
    
    switch(estado.toLowerCase()) {
        case 'pendiente': return 'estado-pendiente';
        case 'en proceso': return 'estado-proceso';
        case 'cancelada': return 'estado-cancelada';
        default: return '';
    }
}

// Ver detalles de orden
async function verDetallesOrden(ordenId) {
    try {
        const response = await fetch(`api/ordenes-data.php?accion=obtener_detalles&id=${ordenId}`);
        const texto = await response.text();
        const data = parsearRespuestaJSON(texto);
        
        if (data.error) {
            mostrarError(data.error);
            return;
        }
        
        mostrarDetallesModal(data);
    } catch (error) {
        mostrarError('Error al cargar detalles: ' + error.message);
    }
}

function mostrarDetallesModal(data) {
    const orden = data.orden || {};
    const fecha = orden.fecha ? new Date(orden.fecha).toLocaleDateString('es-CL') : 'Sin fecha';
    
    let html = `
        <h2>Detalles de Orden #${orden.numero || 'N/A'}</h2>
        <div class="detalles-seccion">
            <h3><i class="fas fa-info-circle"></i> Información General</h3>
            <p><strong>Estado:</strong> <span class="orden-estado ${getEstadoClass(orden.estado)}">${orden.estado || 'Desconocido'}</span></p>
            <p><strong>Fecha:</strong> ${fecha}</p>
            <p><strong>Cliente:</strong> ${orden.cliente_nombre || 'No asignado'}</p>
            <p><strong>Trabajador:</strong> ${orden.trabajador_nombre || 'No asignado'}</p>
            <p><strong>Descripción:</strong> ${orden.descripcion || 'Sin descripción'}</p>
        </div>
        
        <div class="detalles-seccion">
            <h3><i class="fas fa-car"></i> Información del Vehículo</h3>
            <p><strong>Patente:</strong> ${orden.patente || 'No especificada'}</p>
            <p><strong>Color:</strong> ${orden.color || 'No especificado'}</p>
            <p><strong>Motor:</strong> ${orden.motor || 'No especificado'}</p>
        </div>
    `;
    
    if (data.averias && data.averias.length > 0) {
        html += `
            <div class="detalles-seccion">
                <h3><i class="fas fa-tools"></i> Averías Reportadas</h3>
                <ul>`;
        
        data.averias.forEach(averia => {
            html += `<li><strong>${averia.nombre || 'Avería'}</strong></li>`;
        });
        
        html += `</ul></div>`;
    }
    
    if (data.repuestos && data.repuestos.length > 0) {
        html += `
            <div class="detalles-seccion">
                <h3><i class="fas fa-cogs"></i> Repuestos Utilizados</h3>
                <table class="table-detalles">
                    <thead>
                        <tr>
                            <th>Repuesto</th>
                            <th>Cantidad</th>
                            <th>Costo Unitario</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        let totalRepuestos = 0;
        data.repuestos.forEach(repuesto => {
            const total = (repuesto.cantidad_instalada || 0) * (repuesto.costo_unitario || 0);
            totalRepuestos += total;
            
            html += `
                <tr>
                    <td>${repuesto.nombre || 'Repuesto'}</td>
                    <td>${repuesto.cantidad_instalada || 0}</td>
                    <td>$${(repuesto.costo_unitario || 0).toLocaleString('es-CL')}</td>
                    <td>$${total.toLocaleString('es-CL')}</td>
                </tr>`;
        });
        
        html += `
                    <tr>
                        <td colspan="3"><strong>Total Repuestos:</strong></td>
                        <td><strong>$${totalRepuestos.toLocaleString('es-CL')}</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>`;
    }
    
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-detalles').style.display = 'block';
}

function cerrarModal() {
    document.getElementById('modal-detalles').style.display = 'none';
}

// Cambiar estado de orden
async function cambiarEstadoOrden(ordenId) {
    const nuevoEstado = prompt(
        'Seleccione el nuevo estado:\n1. Pendiente\n2. En Proceso\n3. Completada\n4. Cancelada\n\nIngrese el número o el nombre del estado:'
    );
    
    if (!nuevoEstado) return;
    
    let estado;
    switch(nuevoEstado.trim().toLowerCase()) {
        case '1':
        case 'pendiente':
            estado = 'Pendiente';
            break;
        case '2':
        case 'en proceso':
        case 'enproceso':
            estado = 'En Proceso';
            break;
        case '3':
        case 'completada':
            estado = 'Completada';
            break;
        case '4':
        case 'cancelada':
            estado = 'Cancelada';
            break;
        default:
            alert('Estado no válido');
            return;
    }
    
    if (confirm(`¿Está seguro de cambiar el estado a "${estado}"?`)) {
        try {
            const response = await fetch('api/ordenes-data.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    accion: 'cambiar_estado',
                    orden_id: ordenId,
                    estado: estado
                })
            });
            
            const texto = await response.text();
            const result = parsearRespuestaJSON(texto);
            
            if (result.success) {
                mostrarExito('Estado actualizado exitosamente');
                cargarOrdenes();
            } else {
                mostrarError(result.error || 'No se pudo actualizar el estado');
            }
        } catch (error) {
            mostrarError('Error de conexión: ' + error.message);
        }
    }
}

// Limpiar formulario
function limpiarFormulario() {
    const form = document.getElementById('form-nueva-orden');
    if (form) form.reset();
    
    document.getElementById('cliente-info').style.display = 'none';
    document.getElementById('vehiculo-info').style.display = 'none';
    document.getElementById('averias-container').innerHTML = '';
    document.getElementById('repuestos-container').innerHTML = '';
    
    const clienteSearch = document.getElementById('cliente-search');
    const vehiculoSearch = document.getElementById('vehiculo-search');
    if (clienteSearch) clienteSearch.value = '';
    if (vehiculoSearch) vehiculoSearch.value = '';
    
    document.getElementById('cliente-rut').value = '';
    document.getElementById('vehiculo-patente').value = '';
    
    actualizarContadorAverias();
}