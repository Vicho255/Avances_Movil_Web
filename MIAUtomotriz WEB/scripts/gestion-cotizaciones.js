// Variables globales
let clienteSeleccionado = null;
let vehiculoSeleccionado = null;
let repuestosDisponibles = [];
let manoObraDisponible = [];
let repuestosSeleccionados = [];
let manoObraSeleccionada = [];
let piezasExternas = [];

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    cargarClientes();
    cargarVehiculos();
    cargarRepuestos();
    cargarManoObra(); // Usa la nueva función
    
    // Establecer fechas por defecto
    const hoy = new Date();
    document.getElementById('fecha-emision').valueAsDate = hoy;
    
    const fin = new Date();
    fin.setDate(hoy.getDate() + 30);
    document.getElementById('fecha-fin').valueAsDate = fin;
    
    // Agregar evento para calcular totales cuando cambia cualquier cantidad
    document.addEventListener('input', function(e) {
        if (e.target.matches('input[type="number"]')) {
            calcularTotales();
        }
    });
    
    console.log('Sistema de cotizaciones cargado');
});

// ========== FUNCIONES DE CARGA ==========
async function cargarClientes() {
    try {
        const response = await fetch('api/get-clientes.php');
        const data = await response.json();
        
        if (data.success) {
            window.clientes = data.data;
            console.log(`${data.count} clientes cargados`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar clientes');
    }
}

async function cargarVehiculos() {
    try {
        const response = await fetch('api/ordenes-data.php?accion=obtener_vehiculos');
        const data = await response.json();
        
        if (!data.error) {
            window.vehiculos = data;
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar vehículos');
    }
}

async function cargarRepuestos() {
    try {
        const response = await fetch('api/ordenes-data.php?accion=obtener_repuestos');
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        repuestosDisponibles = data;
        console.log(`${data.length} repuestos cargados`);
        
        // Si no hay repuestos, mostrar mensaje
        if (data.length === 0) {
            console.warn('No hay repuestos disponibles en el inventario');
            alert('No hay repuestos disponibles en el inventario. Puede agregar piezas externas.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar repuestos. Puede continuar agregando piezas externas.');
        repuestosDisponibles = [];
    }
}

async function cargarManoObra() {
    try {
        const response = await fetch('api/mano-obra.php');
        const data = await response.json();
        
        if (data.success) {
            manoObraDisponible = data.data;
            console.log(`${data.count} tipos de mano de obra cargados`);
            llenarSelectManoObra();
        } else {
            // Datos de respaldo
            console.warn('Usando datos de respaldo para mano de obra');
            manoObraDisponible = [
                { codigo: 1, descripcion: 'Diagnóstico general', costo: 25000 },
                { codigo: 2, descripcion: 'Cambio de aceite y filtro', costo: 35000 },
                { codigo: 3, descripcion: 'Alineación y balanceo', costo: 40000 },
                { codigo: 4, descripcion: 'Revisión de frenos', costo: 30000 },
                { codigo: 5, descripcion: 'Cambio de batería', costo: 20000 },
                { codigo: 6, descripcion: 'Lavado y detailing', costo: 25000 }
            ];
            llenarSelectManoObra();
        }
    } catch (error) {
        console.error('Error:', error);
        // Datos de respaldo
        manoObraDisponible = [
            { codigo: 1, descripcion: 'Diagnóstico general', costo: 25000 },
            { codigo: 2, descripcion: 'Cambio de aceite y filtro', costo: 35000 },
            { codigo: 3, descripcion: 'Alineación y balanceo', costo: 40000 }
        ];
        llenarSelectManoObra();
    }
}

function llenarSelectManoObra() {
    const select = document.getElementById('mano-obra-select');
    select.innerHTML = '<option value="">Seleccionar tipo de trabajo</option>';
    
    manoObraDisponible.forEach(item => {
        const option = document.createElement('option');
        option.value = item.codigo || item.id;
        option.textContent = `${item.descripcion} - $${(item.costo || 0).toLocaleString('es-CL')}`;
        option.dataset.costo = item.costo || 0;
        option.dataset.descripcion = item.descripcion;
        select.appendChild(option);
    });
}

// ========== FUNCIONES DE BÚSQUEDA Y SELECCIÓN ==========
function filtrarClientes(termino) {
    const dropdown = document.getElementById('clientes-dropdown');
    if (!termino || !window.clientes) {
        dropdown.style.display = 'none';
        return;
    }

    const filtrados = window.clientes.filter(cliente => 
        cliente.nombre.toLowerCase().includes(termino.toLowerCase()) ||
        cliente.apellido.toLowerCase().includes(termino.toLowerCase()) ||
        cliente.rut.toLowerCase().includes(termino.toLowerCase())
    );

    mostrarResultadosDropdown(dropdown, filtrados, 'cliente');
}

function filtrarVehiculos(termino) {
    const dropdown = document.getElementById('vehiculos-dropdown');
    if (!termino || !window.vehiculos) {
        dropdown.style.display = 'none';
        return;
    }

    const filtrados = window.vehiculos.filter(vehiculo => 
        vehiculo.patente.toLowerCase().includes(termino.toLowerCase()) ||
        (vehiculo.dueno && vehiculo.dueno.toLowerCase().includes(termino.toLowerCase())) ||
        (vehiculo.modelo && vehiculo.modelo.toLowerCase().includes(termino.toLowerCase()))
    );

    mostrarResultadosDropdown(dropdown, filtrados, 'vehiculo');
}

function filtrarRepuestos(termino) {
    const dropdown = document.getElementById('repuestos-dropdown');
    if (!termino || repuestosDisponibles.length === 0) {
        dropdown.style.display = 'none';
        return;
    }

    const filtrados = repuestosDisponibles.filter(repuesto => 
        repuesto.nombre.toLowerCase().includes(termino.toLowerCase()) ||
        (repuesto.codigo && repuesto.codigo.toLowerCase().includes(termino.toLowerCase()))
    );

    mostrarResultadosDropdown(dropdown, filtrados, 'repuesto');
}

function mostrarResultadosDropdown(dropdown, items, tipo) {
    if (items.length === 0) {
        dropdown.innerHTML = '<div class="dropdown-item">No se encontraron resultados</div>';
    } else {
        dropdown.innerHTML = items.map(item => {
            if (tipo === 'cliente') {
                return `<div class="dropdown-item" onclick="seleccionarCliente('${item.rut}')">
                    ${item.nombre} ${item.apellido} - ${item.rut}
                </div>`;
            } else if (tipo === 'vehiculo') {
                return `<div class="dropdown-item" onclick="seleccionarVehiculo('${item.patente}')">
                    ${item.patente} - ${item.modelo || 'Sin modelo'} - ${item.dueno || 'Sin dueño'}
                </div>`;
            } else if (tipo === 'repuesto') {
                return `<div class="dropdown-item" onclick="seleccionarRepuesto('${item.codigo}')">
                    ${item.nombre} - $${(item.costo || 0).toLocaleString('es-CL')}
                </div>`;
            }
        }).join('');
    }
    dropdown.style.display = 'block';
}

// ========== FUNCIONES DE SELECCIÓN ==========
function seleccionarCliente(rut) {
    const cliente = window.clientes.find(c => c.rut === rut);
    if (!cliente) return;

    clienteSeleccionado = cliente;
    document.getElementById('cliente-rut').value = cliente.rut;
    document.getElementById('cliente-search').value = `${cliente.nombre} ${cliente.apellido} (${cliente.rut})`;
    document.getElementById('cliente-nombre').textContent = `${cliente.nombre} ${cliente.apellido}`;
    document.getElementById('cliente-telefono').textContent = cliente.telefono || 'No registrado';
    document.getElementById('cliente-correo').textContent = cliente.email || 'No registrado';
    document.getElementById('clientes-dropdown').style.display = 'none';
    document.getElementById('cliente-info').style.display = 'block';
}

function seleccionarVehiculo(patente) {
    const vehiculo = window.vehiculos.find(v => v.patente === patente);
    if (!vehiculo) return;

    vehiculoSeleccionado = vehiculo;
    document.getElementById('vehiculo-patente').value = vehiculo.patente;
    document.getElementById('vehiculo-search').value = `${vehiculo.patente} - ${vehiculo.modelo || 'Sin modelo'}`;
    document.getElementById('vehiculo-modelo').textContent = vehiculo.modelo || 'No especificado';
    document.getElementById('vehiculo-color').textContent = vehiculo.color || 'No especificado';
    document.getElementById('vehiculo-anio').textContent = vehiculo.anio || 'No especificado';
    document.getElementById('vehiculos-dropdown').style.display = 'none';
    document.getElementById('vehiculo-info').style.display = 'block';
}

function seleccionarRepuesto(codigo) {
    const repuesto = repuestosDisponibles.find(r => r.codigo === codigo);
    if (!repuesto) return;

    // Verificar si ya está seleccionado
    const existe = repuestosSeleccionados.find(r => r.codigo === codigo);
    if (existe) {
        alert('Este repuesto ya está en la lista');
        return;
    }

    // Agregar a la lista
    repuestosSeleccionados.push({
        codigo: repuesto.codigo,
        nombre: repuesto.nombre,
        costo: repuesto.costo || 0,
        cantidad: 1,
        subtotal: repuesto.costo || 0
    });

    actualizarListaRepuestos();
    document.getElementById('repuestos-dropdown').style.display = 'none';
    document.getElementById('repuesto-search').value = '';
    calcularTotales();
}

// ========== FUNCIONES PARA MANO DE OBRA ==========
function agregarManoObra() {
    const select = document.getElementById('mano-obra-select');
    if (!select.value) {
        alert('Seleccione un tipo de trabajo');
        return;
    }

    const selectedOption = select.options[select.selectedIndex];
    const codigo = select.value;
    const descripcion = selectedOption.dataset.descripcion;
    const costo = parseFloat(selectedOption.dataset.costo) || 0;

    // Verificar si ya está seleccionado
    const existe = manoObraSeleccionada.find(m => m.codigo === codigo);
    if (existe) {
        alert('Este trabajo ya está en la lista');
        return;
    }

    // Agregar a la lista
    manoObraSeleccionada.push({
        codigo: codigo,
        descripcion: descripcion,
        costo: costo
    });

    actualizarListaManoObra();
    select.value = '';
    calcularTotales();
}

function agregarPiezaExterna() {
    const nombre = prompt('Nombre de la pieza externa:');
    if (!nombre) return;

    const categoria = prompt('Categoría (opcional):', 'Externa');
    
    const costoStr = prompt('Costo de la pieza ($):');
    const costo = parseFloat(costoStr) || 0;
    if (costo <= 0) {
        alert('Ingrese un costo válido');
        return;
    }

    const valorStr = prompt('Valor de venta ($) [Enter para costo + 30%]:');
    let valor = parseFloat(valorStr) || 0;
    if (valor === 0) {
        valor = Math.round(costo * 1.3); // 30% de margen por defecto
    }

    const id = Date.now();
    piezasExternas.push({
        id: id,
        nombre: nombre,
        categoria: categoria || 'Externa',
        costo: costo,
        valor: valor,
        cantidad: 1,
        subtotal: valor
    });

    actualizarListaPiezasExternas();
    calcularTotales();
}

// ========== FUNCIONES DE ACTUALIZACIÓN DE LISTAS ==========
function actualizarListaRepuestos() {
    const lista = document.getElementById('repuestos-lista');
    if (repuestosSeleccionados.length === 0) {
        lista.innerHTML = '<p class="lista-vacia">No hay repuestos seleccionados</p>';
        return;
    }

    lista.innerHTML = repuestosSeleccionados.map((repuesto, index) => `
        <div class="item-lista" data-index="${index}">
            <div class="item-info">
                <strong>${repuesto.nombre}</strong>
                <div>Código: ${repuesto.codigo}</div>
                <div>Costo unitario: $${repuesto.costo.toLocaleString('es-CL')}</div>
            </div>
            <div class="item-controls">
                <div class="cantidad-control">
                    <button type="button" onclick="cambiarCantidadRepuesto(${index}, -1)">-</button>
                    <input type="number" value="${repuesto.cantidad}" min="1" 
                           onchange="actualizarCantidadRepuesto(${index}, this.value)">
                    <button type="button" onclick="cambiarCantidadRepuesto(${index}, 1)">+</button>
                </div>
                <div class="item-subtotal">
                    Subtotal: $${repuesto.subtotal.toLocaleString('es-CL')}
                </div>
                <button type="button" class="btn-eliminar" onclick="eliminarRepuesto(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function actualizarListaManoObra() {
    const lista = document.getElementById('mano-obra-lista');
    if (manoObraSeleccionada.length === 0) {
        lista.innerHTML = '<p class="lista-vacia">No hay mano de obra seleccionada</p>';
        return;
    }

    lista.innerHTML = manoObraSeleccionada.map((item, index) => `
        <div class="item-lista">
            <div class="item-info">
                <strong>${item.descripcion}</strong>
            </div>
            <div class="item-controls">
                <div class="item-subtotal">
                    Costo: $${item.costo.toLocaleString('es-CL')}
                </div>
                <button type="button" class="btn-eliminar" onclick="eliminarManoObra(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function actualizarListaPiezasExternas() {
    const lista = document.getElementById('piezas-externas-lista');
    if (piezasExternas.length === 0) {
        lista.innerHTML = '<p class="lista-vacia">No hay piezas externas</p>';
        return;
    }

    lista.innerHTML = piezasExternas.map((pieza, index) => `
        <div class="item-lista">
            <div class="item-info">
                <strong>${pieza.nombre}</strong>
                <div>Costo: $${pieza.costo.toLocaleString('es-CL')}</div>
                <div>Valor: $${pieza.valor.toLocaleString('es-CL')}</div>
            </div>
            <div class="item-controls">
                <div class="cantidad-control">
                    <button type="button" onclick="cambiarCantidadPieza(${index}, -1)">-</button>
                    <input type="number" value="${pieza.cantidad}" min="1" 
                           onchange="actualizarCantidadPieza(${index}, this.value)">
                    <button type="button" onclick="cambiarCantidadPieza(${index}, 1)">+</button>
                </div>
                <div class="item-subtotal">
                    Subtotal: $${pieza.subtotal.toLocaleString('es-CL')}
                </div>
                <button type="button" class="btn-eliminar" onclick="eliminarPiezaExterna(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// ========== FUNCIONES DE CONTROL ==========
function cambiarCantidadRepuesto(index, delta) {
    const repuesto = repuestosSeleccionados[index];
    const nuevaCantidad = repuesto.cantidad + delta;
    
    if (nuevaCantidad < 1) {
        eliminarRepuesto(index);
        return;
    }
    
    repuesto.cantidad = nuevaCantidad;
    repuesto.subtotal = repuesto.costo * nuevaCantidad;
    actualizarListaRepuestos();
    calcularTotales();
}

function actualizarCantidadRepuesto(index, valor) {
    const cantidad = parseInt(valor) || 1;
    if (cantidad < 1) {
        eliminarRepuesto(index);
        return;
    }
    
    const repuesto = repuestosSeleccionados[index];
    repuesto.cantidad = cantidad;
    repuesto.subtotal = repuesto.costo * cantidad;
    actualizarListaRepuestos();
    calcularTotales();
}

function cambiarCantidadPieza(index, delta) {
    const pieza = piezasExternas[index];
    const nuevaCantidad = pieza.cantidad + delta;
    
    if (nuevaCantidad < 1) {
        eliminarPiezaExterna(index);
        return;
    }
    
    pieza.cantidad = nuevaCantidad;
    pieza.subtotal = pieza.valor * nuevaCantidad;
    actualizarListaPiezasExternas();
    calcularTotales();
}

function actualizarCantidadPieza(index, valor) {
    const cantidad = parseInt(valor) || 1;
    if (cantidad < 1) {
        eliminarPiezaExterna(index);
        return;
    }
    
    const pieza = piezasExternas[index];
    pieza.cantidad = cantidad;
    pieza.subtotal = pieza.valor * cantidad;
    actualizarListaPiezasExternas();
    calcularTotales();
}

function eliminarRepuesto(index) {
    repuestosSeleccionados.splice(index, 1);
    actualizarListaRepuestos();
    calcularTotales();
}

function eliminarManoObra(index) {
    manoObraSeleccionada.splice(index, 1);
    actualizarListaManoObra();
    calcularTotales();
}

function eliminarPiezaExterna(index) {
    piezasExternas.splice(index, 1);
    actualizarListaPiezasExternas();
    calcularTotales();
}

function validarFormularioCotizacion() {
    if (!clienteSeleccionado) {
        alert('Debe seleccionar un cliente');
        return false;
    }

    const fechaEmision = document.getElementById('fecha-emision').value;
    const fechaFin = document.getElementById('fecha-fin').value;
    
    if (!fechaEmision || !fechaFin) {
        alert('Complete las fechas de emisión y vigencia');
        return false;
    }

    // Validar que la fecha de fin sea posterior a la de emisión
    if (new Date(fechaFin) < new Date(fechaEmision)) {
        alert('La fecha de vigencia debe ser posterior a la fecha de emisión');
        return false;
    }

    const descripcion = document.getElementById('descripcion').value;
    if (!descripcion || descripcion.trim().length < 10) {
        alert('Por favor, ingrese una descripción detallada del trabajo (mínimo 10 caracteres)');
        return false;
    }

    // Validar que haya al menos un item (repuesto, mano de obra o pieza externa)
    if (repuestosSeleccionados.length === 0 && 
        manoObraSeleccionada.length === 0 && 
        piezasExternas.length === 0) {
        alert('Debe agregar al menos un item (repuesto, mano de obra o pieza externa)');
        return false;
    }

    return true;
}

// ========== CÁLCULO DE TOTALES ==========
function calcularTotales() {
    let subtotalRepuestos = 0;
    repuestosSeleccionados.forEach(r => {
        subtotalRepuestos += r.subtotal;
    });

    let subtotalManoObra = 0;
    manoObraSeleccionada.forEach(m => {
        subtotalManoObra += m.costo;
    });

    let subtotalExternas = 0;
    piezasExternas.forEach(p => {
        subtotalExternas += p.subtotal;
    });

    const totalNeto = subtotalRepuestos + subtotalManoObra + subtotalExternas;
    const iva = Math.round(totalNeto * 0.19);
    const totalFinal = totalNeto + iva;

    // Actualizar UI
    document.getElementById('subtotal-repuestos').textContent = `$${subtotalRepuestos.toLocaleString('es-CL')}`;
    document.getElementById('subtotal-mano-obra').textContent = `$${subtotalManoObra.toLocaleString('es-CL')}`;
    document.getElementById('subtotal-externas').textContent = `$${subtotalExternas.toLocaleString('es-CL')}`;
    document.getElementById('total-neto').textContent = `$${totalNeto.toLocaleString('es-CL')}`;
    document.getElementById('total-iva').textContent = `$${iva.toLocaleString('es-CL')}`;
    document.getElementById('total-final').textContent = `$${totalFinal.toLocaleString('es-CL')}`;

    return {
        subtotalRepuestos,
        subtotalManoObra,
        subtotalExternas,
        totalNeto,
        iva,
        totalFinal
    };
}

// ========== GUARDAR COTIZACIÓN ==========
async function guardarCotizacion() {
    if (!validarFormularioCotizacion()) {
        return;
    }

    const fechaEmision = document.getElementById('fecha-emision').value;
    const fechaFin = document.getElementById('fecha-fin').value;
    const descripcion = document.getElementById('descripcion').value;

    const { totalNeto, iva, totalFinal } = calcularTotales();

    const cotizacionData = {
        cliente_rut: clienteSeleccionado.rut,
        vehiculo_patente: vehiculoSeleccionado?.patente || '',
        fecha_emision: fechaEmision,
        fecha_fin: fechaFin,
        descripcion: descripcion,
        repuestos: repuestosSeleccionados,
        mano_obra: manoObraSeleccionada,
        piezas_externas: piezasExternas,
        total_neto: totalNeto,
        iva: iva,
        total: totalFinal
    };

    try {
        // Mostrar indicador de carga
        const submitBtn = document.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        submitBtn.disabled = true;

        const response = await fetch('api/guardar-cotizacion.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cotizacionData)
        });

        const data = await response.json();

        // Restaurar botón
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;

        if (data.success) {
            alert(`✅ Cotización guardada exitosamente\nNúmero: ${data.cotizacion_numero}\nTotal: $${totalFinal.toLocaleString('es-CL')}`);
            
            // Opcional: Descargar PDF automáticamente
            if (confirm('¿Desea generar el PDF de la cotización?')) {
                generarPDF(data.cotizacion_numero);
            }
            
            // Opcional: Limpiar formulario después de guardar
            if (confirm('¿Desea crear una nueva cotización?')) {
                limpiarFormulario();
            }
        } else {
            alert('❌ Error al guardar cotización: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error de conexión al guardar cotización');
        
        // Restaurar botón en caso de error
        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Cotización';
        submitBtn.disabled = false;
    }
}

// ========== GENERAR PDF ==========
function generarPDF(numeroCotizacion = null) {
    if (!clienteSeleccionado) {
        alert('Debe seleccionar un cliente');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const fechaEmision = document.getElementById('fecha-emision').value;
    const fechaFin = document.getElementById('fecha-fin').value;
    const descripcion = document.getElementById('descripcion').value;
    const { totalNeto, iva, totalFinal } = calcularTotales();

    // Configurar márgenes
    const marginLeft = 20;
    const marginRight = 190;
    let y = 20;

    // Encabezado
    doc.setFontSize(20);
    doc.text('COTIZACIÓN', 105, y, { align: 'center' });
    y += 10;
    
    doc.setFontSize(10);
    doc.text('MiAutomotriz', 105, y, { align: 'center' });
    y += 5;
    doc.text('Servicios Automotrices Profesionales', 105, y, { align: 'center' });
    y += 5;
    doc.text('Av. Principal 123, Santiago, Chile | Tel: +56 2 2345 6789', 105, y, { align: 'center' });
    y += 5;
    doc.text('RUT: 76.543.210-9 | contacto@miautomotriz.cl', 105, y, { align: 'center' });
    
    y += 10;

    // Línea separadora
    doc.line(marginLeft, y, marginRight, y);
    y += 10;

    // Datos de la cotización
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Cotización N°: ${numeroCotizacion || 'PRELIMINAR'}`, marginLeft, y);
    y += 7;
    
    doc.setFont(undefined, 'normal');
    doc.text(`Fecha Emisión: ${fechaEmision}`, marginLeft, y);
    doc.text(`Válida hasta: ${fechaFin}`, 140, y);
    y += 10;

    // Datos del cliente
    doc.setFont(undefined, 'bold');
    doc.text('DATOS DEL CLIENTE:', marginLeft, y);
    y += 7;
    
    doc.setFont(undefined, 'normal');
    doc.text(`Nombre: ${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`, marginLeft + 5, y);
    y += 5;
    doc.text(`RUT: ${clienteSeleccionado.rut}`, marginLeft + 5, y);
    y += 5;
    doc.text(`Teléfono: ${clienteSeleccionado.telefono || 'No registrado'}`, marginLeft + 5, y);
    y += 5;
    doc.text(`Correo: ${clienteSeleccionado.email || 'No registrado'}`, marginLeft + 5, y);
    
    // Datos del vehículo si existe
    if (vehiculoSeleccionado) {
        y += 7;
        doc.setFont(undefined, 'bold');
        doc.text('DATOS DEL VEHÍCULO:', marginLeft, y);
        y += 7;
        
        doc.setFont(undefined, 'normal');
        doc.text(`Patente: ${vehiculoSeleccionado.patente}`, marginLeft + 5, y);
        y += 5;
        doc.text(`Modelo: ${vehiculoSeleccionado.modelo || 'No especificado'}`, marginLeft + 5, y);
        y += 5;
        doc.text(`Color: ${vehiculoSeleccionado.color || 'No especificado'}`, marginLeft + 5, y);
    }
    
    y += 10;

    // Descripción del trabajo
    if (descripcion) {
        doc.setFont(undefined, 'bold');
        doc.text('DESCRIPCIÓN DEL TRABAJO:', marginLeft, y);
        y += 7;
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        const descLines = doc.splitTextToSize(descripcion, 160);
        descLines.forEach(line => {
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            doc.text(line, marginLeft + 5, y);
            y += 5;
        });
        y += 5;
    }

    // Tabla de repuestos
    if (repuestosSeleccionados.length > 0) {
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('REPUESTOS:', marginLeft, y);
        y += 5;
        
        const repuestosTable = repuestosSeleccionados.map(r => [
            r.nombre,
            r.cantidad,
            `$${r.costo.toLocaleString('es-CL')}`,
            `$${r.subtotal.toLocaleString('es-CL')}`
        ]);
        
        doc.autoTable({
            startY: y,
            head: [['Repuesto', 'Cantidad', 'Precio Unit.', 'Subtotal']],
            body: repuestosTable,
            theme: 'grid',
            headStyles: { fillColor: [0, 123, 255] },
            margin: { left: marginLeft, right: marginRight }
        });
        
        y = doc.lastAutoTable.finalY + 5;
    }

    // Tabla de mano de obra
    if (manoObraSeleccionada.length > 0) {
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('MANO DE OBRA:', marginLeft, y);
        y += 5;
        
        const manoObraTable = manoObraSeleccionada.map(m => [
            m.descripcion,
            `$${m.costo.toLocaleString('es-CL')}`
        ]);
        
        doc.autoTable({
            startY: y,
            head: [['Descripción', 'Costo']],
            body: manoObraTable,
            theme: 'grid',
            headStyles: { fillColor: [40, 167, 69] },
            margin: { left: marginLeft, right: marginRight }
        });
        
        y = doc.lastAutoTable.finalY + 5;
    }

    // Tabla de piezas externas
    if (piezasExternas.length > 0) {
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('PIEZAS EXTERNAS/ESPECIALES:', marginLeft, y);
        y += 5;
        
        const piezasTable = piezasExternas.map(p => [
            p.nombre,
            p.cantidad,
            `$${p.valor.toLocaleString('es-CL')}`,
            `$${p.subtotal.toLocaleString('es-CL')}`
        ]);
        
        doc.autoTable({
            startY: y,
            head: [['Descripción', 'Cantidad', 'Valor Unit.', 'Subtotal']],
            body: piezasTable,
            theme: 'grid',
            headStyles: { fillColor: [255, 193, 7] },
            margin: { left: marginLeft, right: marginRight }
        });
        
        y = doc.lastAutoTable.finalY + 10;
    }

    // Totales
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    
    // Fondo para totales
    doc.setFillColor(240, 240, 240);
    doc.rect(marginLeft, y, 170, 40, 'F');
    
    doc.text('RESUMEN DE COSTOS', marginLeft + 5, y + 8);
    
    doc.setFont(undefined, 'normal');
    doc.text('Total Neto:', marginLeft + 100, y + 8);
    doc.text(`$${totalNeto.toLocaleString('es-CL')}`, marginRight - 20, y + 8, { align: 'right' });
    
    doc.text('IVA (19%):', marginLeft + 100, y + 16);
    doc.text(`$${iva.toLocaleString('es-CL')}`, marginRight - 20, y + 16, { align: 'right' });
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    doc.text('TOTAL:', marginLeft + 100, y + 28);
    doc.text(`$${totalFinal.toLocaleString('es-CL')}`, marginRight - 20, y + 28, { align: 'right' });
    
    y += 50;

    // Términos y condiciones
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('TÉRMINOS Y CONDICIONES:', marginLeft, y);
    y += 5;
    
    const condiciones = [
        '1. Esta cotización es válida por 30 días a partir de la fecha de emisión.',
        '2. Los precios incluyen IVA.',
        '3. Los repuestos tienen garantía de fábrica según las políticas del proveedor.',
        '4. Se requiere anticipo del 50% para iniciar el trabajo.',
        '5. Los tiempos de entrega son estimados y pueden variar.',
        '6. Cualquier cambio en el trabajo deberá ser aprobado por escrito.'
    ];
    
    condiciones.forEach(condicion => {
        if (y > 250) {
            doc.addPage();
            y = 20;
        }
        doc.text(condicion, marginLeft + 5, y);
        y += 4;
    });
    
    y += 10;
    
    // Firmas
    doc.text('_________________________', marginLeft, y);
    doc.text('Firma del Cliente', marginLeft, y + 5);
    
    doc.text('_________________________', marginRight - 60, y);
    doc.text('MiAutomotriz', marginRight - 60, y + 5);
    
    // Pie de página
    y += 20;
    doc.setFontSize(7);
    doc.text('Gracias por confiar en nuestros servicios | www.miautomotriz.cl', 105, y, { align: 'center' });

    // Generar nombre de archivo
    const fileName = `Cotizacion_${numeroCotizacion || 'PRELIMINAR'}_${clienteSeleccionado.rut}_${fechaEmision}.pdf`;
    
    // Descargar PDF
    doc.save(fileName);
}

// ========== FUNCIONES AUXILIARES ==========
function limpiarFormulario() {
    clienteSeleccionado = null;
    vehiculoSeleccionado = null;
    repuestosSeleccionados = [];
    manoObraSeleccionada = [];
    piezasExternas = [];

    // Limpiar campos
    document.getElementById('cliente-search').value = '';
    document.getElementById('cliente-rut').value = '';
    document.getElementById('cliente-info').style.display = 'none';
    
    document.getElementById('vehiculo-search').value = '';
    document.getElementById('vehiculo-patente').value = '';
    document.getElementById('vehiculo-info').style.display = 'none';
    
    document.getElementById('descripcion').value = '';
    
    // Actualizar listas
    actualizarListaRepuestos();
    actualizarListaManoObra();
    actualizarListaPiezasExternas();
    
    // Restablecer fechas
    const hoy = new Date();
    document.getElementById('fecha-emision').valueAsDate = hoy;
    const fin = new Date();
    fin.setDate(hoy.getDate() + 30);
    document.getElementById('fecha-fin').valueAsDate = fin;
    
    calcularTotales();
    
    alert('Formulario limpiado correctamente');
}

function enviarPorCorreo() {
    if (!clienteSeleccionado) {
        alert('Debe seleccionar un cliente primero');
        return;
    }

    const email = clienteSeleccionado.email;
    if (!email || email === 'No registrado') {
        alert('El cliente no tiene correo registrado');
        return;
    }

    const asunto = prompt('Asunto del correo:', `Cotización MiAutomotriz - ${new Date().toLocaleDateString()}`);
    if (!asunto) return;

    const mensaje = prompt('Mensaje adicional:', `Estimado/a ${clienteSeleccionado.nombre},\n\nAdjunto encontrará la cotización solicitada.\n\nSaludos cordiales,\nMiAutomotriz`);
    if (!mensaje) return;

    alert(`Se enviará la cotización a: ${email}\n\nAsunto: ${asunto}\n\nEsta funcionalidad requiere configuración del servidor SMTP.`);
    // Aquí integrarías con una API de envío de correos
}

// ========== EVENT LISTENERS ==========
document.getElementById('cotizacion-form').addEventListener('submit', function(e) {
    e.preventDefault();
    guardarCotizacion();
});

// Cerrar dropdowns al hacer clic fuera
document.addEventListener('click', function(e) {
    if (!e.target.closest('.search-wrapper')) {
        document.getElementById('clientes-dropdown').style.display = 'none';
        document.getElementById('vehiculos-dropdown').style.display = 'none';
        document.getElementById('repuestos-dropdown').style.display = 'none';
    }
});