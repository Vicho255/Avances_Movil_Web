let clienteSeleccionado = null;
let ordenSeleccionada = null;
let detallesOrden = null;

// Cargar clientes al iniciar
document.addEventListener('DOMContentLoaded', function() {
    cargarClientes();
    document.getElementById('fecha').valueAsDate = new Date();
});

async function cargarClientes() {
    try {
        const response = await fetch('api/get-clientes.php');
        const data = await response.json();
        
        if (data.success) {
            window.clientes = data.data;
            console.log(`${data.count} clientes cargados`);
        } else {
            alert('Error al cargar clientes: ' + (data.message || data.error));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar clientes');
    }
}

function filtrarClientes(termino) {
    const dropdown = document.getElementById('clientes-dropdown');
    if (!termino) {
        dropdown.style.display = 'none';
        return;
    }

    if (!window.clientes) {
        alert('Clientes no cargados');
        return;
    }

    const filtrados = window.clientes.filter(cliente => 
        cliente.nombre.toLowerCase().includes(termino.toLowerCase()) ||
        cliente.apellido.toLowerCase().includes(termino.toLowerCase()) ||
        cliente.rut.toLowerCase().includes(termino.toLowerCase())
    );

    if (filtrados.length === 0) {
        dropdown.innerHTML = '<div class="dropdown-item">No se encontraron clientes</div>';
    } else {
        dropdown.innerHTML = filtrados.map(cliente => `
            <div class="dropdown-item" onclick="seleccionarCliente('${cliente.rut}')">
                ${cliente.nombre} ${cliente.apellido} - ${cliente.rut}
            </div>
        `).join('');
    }
    dropdown.style.display = 'block';
}

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

    // Cargar órdenes del cliente
    cargarOrdenesCliente();
}

async function cargarOrdenesCliente() {
    if (!clienteSeleccionado) {
        alert('Primero seleccione un cliente');
        return;
    }

    try {
        const response = await fetch(`api/ordenes-data.php?accion=obtener_ordenes_cliente&cliente_rut=${clienteSeleccionado.rut}`);
        const data = await response.json();
        
        const select = document.getElementById('orden-select');
        select.innerHTML = '<option value="">Seleccione una orden de trabajo</option>';
        
        if (data.ordenes && data.ordenes.length > 0) {
            data.ordenes.forEach(orden => {
                const option = document.createElement('option');
                option.value = orden.numero;
                option.textContent = `Orden #${orden.numero} - ${orden.patente} - ${orden.estado}`;
                select.appendChild(option);
            });
        } else {
            select.innerHTML += '<option value="" disabled>No hay órdenes activas para este cliente</option>';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar órdenes del cliente');
    }
}

async function cargarDetallesOrden(numeroOrden) {
    if (!numeroOrden) {
        document.getElementById('orden-info').style.display = 'none';
        document.getElementById('detalles-orden').style.display = 'none';
        ordenSeleccionada = null;
        detallesOrden = null;
        return;
    }

    try {
        // Usar tu endpoint existente
        const response = await fetch(`api/get-detalle-orden.php?numero=${numeroOrden}`);
        const data = await response.json();
        
        if (data.success) {
            ordenSeleccionada = data.orden;
            detallesOrden = data;
            
            // Mostrar info básica
            document.getElementById('orden-vehiculo').textContent = 
                `${ordenSeleccionada.patente || ordenSeleccionada.Patente || ''} ${ordenSeleccionada.marca || ''} ${ordenSeleccionada.modelo || ''}`;
            document.getElementById('orden-descripcion').textContent = ordenSeleccionada.descripcion || ordenSeleccionada.Descripcion || 'Sin descripción';
            document.getElementById('orden-estado').textContent = ordenSeleccionada.estado || ordenSeleccionada.Estado || 'Desconocido';
            document.getElementById('orden-info').style.display = 'block';
            
            // Calcular y mostrar detalles
            cargarManoObraDesdeDetalles();
            actualizarTablaRepuestos();
            calcularTotales();
            document.getElementById('detalles-orden').style.display = 'block';
        } else {
            alert('Error al cargar detalles: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar detalles de la orden');
    }
}

function cargarManoObraDesdeDetalles() {
    if (!detallesOrden || !detallesOrden.mano_obra) return;
    
    const tabla = document.querySelector('#tabla-mano-obra tbody');
    tabla.innerHTML = '';
    
    detallesOrden.mano_obra.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.descripcion || item.Descripcion || 'Servicio'}</td>
            <td>$${parseInt(item.costo || item.Costo || 0).toLocaleString('es-CL')}</td>
        `;
        tabla.appendChild(row);
    });
}

function actualizarTablaRepuestos() {
    if (!detallesOrden || !detallesOrden.repuestos) return;
    
    const tabla = document.querySelector('#tabla-repuestos tbody');
    tabla.innerHTML = '';
    
    detallesOrden.repuestos.forEach(repuesto => {
        const cantidad = parseInt(repuesto.cantidad_instalada || repuesto.Cantidad_Instalada) || 1;
        const costo = parseInt(repuesto.costo_unitario || repuesto.Costo_Unitario) || 0;
        const subtotal = cantidad * costo;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${repuesto.nombre || repuesto.Nombre || 'Repuesto'}</td>
            <td>${cantidad}</td>
            <td>$${costo.toLocaleString('es-CL')}</td>
            <td>$${subtotal.toLocaleString('es-CL')}</td>
        `;
        tabla.appendChild(row);
    });
}

function calcularTotales() {
    // Calcular total repuestos
    let totalRepuestos = 0;
    if (detallesOrden && detallesOrden.repuestos) {
        detallesOrden.repuestos.forEach(r => {
            totalRepuestos += (parseInt(r.cantidad_instalada) || 1) * (parseInt(r.costo_unitario) || 0);
        });
    }
    
    // Calcular total mano de obra
    let totalManoObra = 0;
    const filasManoObra = document.querySelectorAll('#tabla-mano-obra tbody tr');
    filasManoObra.forEach(row => {
        const costo = parseInt(row.cells[1].textContent.replace(/[^0-9]/g, '')) || 0;
        totalManoObra += costo;
    });
    
    const neto = totalRepuestos + totalManoObra;
    const iva = Math.round(neto * 0.19);
    const total = neto + iva;
    
    document.getElementById('total-neto').textContent = `$${neto.toLocaleString('es-CL')}`;
    document.getElementById('total-iva').textContent = `$${iva.toLocaleString('es-CL')}`;
    document.getElementById('total-final').textContent = `$${total.toLocaleString('es-CL')}`;
    
    return { neto, iva, total };
}

async function guardarFactura() {
    if (!clienteSeleccionado || !ordenSeleccionada) {
        alert('Debe seleccionar un cliente y una orden de trabajo');
        return;
    }
    
    const { neto, iva, total } = calcularTotales();
    const fecha = document.getElementById('fecha').value;
    const metodoPago = document.getElementById('metodo-pago').value;
    
    if (!fecha || !metodoPago) {
        alert('Complete todos los campos requeridos');
        return;
    }
    
    try {
        const facturaData = {
            cliente_rut: clienteSeleccionado.rut,
            orden_trabajo_numero: ordenSeleccionada.numero,
            fecha_emision: fecha,
            neto: neto,
            iva: iva,
            total: total,
            metodo_pago: metodoPago,
            detalle_prestacion_servicio: ordenSeleccionada.descripcion || 'Servicio automotriz'
        };
        
        const response = await fetch('api/guardar-factura.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(facturaData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`Factura guardada exitosamente\nNúmero de Factura: ${data.factura_numero}`);
            // Actualizar estado de la orden a "Completada"
            await actualizarEstadoOrden(ordenSeleccionada.numero, 'Completada');
            // Limpiar formulario
            limpiarFormulario();
        } else {
            alert('Error al guardar factura: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar factura');
    }
}

async function actualizarEstadoOrden(numeroOrden, estado) {
    try {
        const response = await fetch('api/ordenes-data.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `accion=cambiar_estado&orden_id=${numeroOrden}&estado=${estado}`
        });
        
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error actualizando estado:', error);
        return false;
    }
}

function limpiarFormulario() {
    clienteSeleccionado = null;
    ordenSeleccionada = null;
    detallesOrden = null;
    
    document.getElementById('cliente-search').value = '';
    document.getElementById('cliente-rut').value = '';
    document.getElementById('cliente-info').style.display = 'none';
    document.getElementById('orden-select').value = '';
    document.getElementById('orden-info').style.display = 'none';
    document.getElementById('detalles-orden').style.display = 'none';
    document.getElementById('metodo-pago').value = '';
    document.getElementById('fecha').valueAsDate = new Date();
}

async function generarPDF() {
    if (!clienteSeleccionado || !ordenSeleccionada) {
        alert('Debe seleccionar un cliente y una orden de trabajo');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const { neto, iva, total } = calcularTotales();
    const fecha = document.getElementById('fecha').value;
    const metodoPago = document.getElementById('metodo-pago').value;
    
    // Encabezado
    doc.image('public/img/Logo.svg', 15, 10, 30, 15);
    doc.setFontSize(20);
    doc.text('FACTURA', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('MiAutomotriz', 105, 30, { align: 'center' });
    doc.text('Av. Principal 123, Santiago, Chile', 105, 35, { align: 'center' });
    doc.text('Tel: +56 2 2345 6789 | RUT: 76.543.210-9', 105, 40, { align: 'center' });
    
    // Línea separadora
    doc.line(20, 45, 190, 45);
    
    // Datos de la factura
    let y = 55;
    doc.setFontSize(12);
    doc.text(`Factura #: 000`, 20, y);
    doc.text(`Fecha: ${fecha}`, 140, y);
    y += 10;
    
    // Datos del cliente
    doc.setFontSize(10);
    doc.text('DATOS DEL CLIENTE:', 20, y);
    y += 7;
    doc.text(`Nombre: ${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`, 25, y);
    y += 7;
    doc.text(`RUT: ${clienteSeleccionado.rut}`, 25, y);
    y += 7;
    doc.text(`Teléfono: ${clienteSeleccionado.telefono || 'No registrado'}`, 25, y);
    y += 7;
    doc.text(`Correo: ${clienteSeleccionado.email || 'No registrado'}`, 25, y);
    
    // Datos de la orden
    y += 10;
    doc.text('DATOS DE LA ORDEN:', 20, y);
    y += 7;
    doc.text(`Orden #: ${ordenSeleccionada.numero}`, 25, y);
    y += 7;
    doc.text(`Vehículo: ${ordenSeleccionada.patente || ''}`, 25, y);
    y += 7;
    doc.text(`Descripción: ${ordenSeleccionada.descripcion || ''}`, 25, y);
    
    // Tabla de repuestos
    y += 15;
    doc.autoTable({
        startY: y,
        head: [['Repuesto', 'Cantidad', 'Precio Unit.', 'Subtotal']],
        body: detallesOrden.repuestos.map(r => [
            r.nombre,
            r.cantidad_instalada || 1,
            `$${(parseInt(r.costo_unitario) || 0).toLocaleString('es-CL')}`,
            `$${((parseInt(r.cantidad_instalada) || 1) * (parseInt(r.costo_unitario) || 0)).toLocaleString('es-CL')}`
        ]),
        theme: 'grid'
    });
    
    // Tabla de mano de obra
    y = doc.lastAutoTable.finalY + 10;
    doc.autoTable({
        startY: y,
        head: [['Descripción', 'Costo']],
        body: Array.from(document.querySelectorAll('#tabla-mano-obra tbody tr')).map(row => [
            row.cells[0].textContent,
            row.cells[1].textContent
        ]),
        theme: 'grid'
    });
    
    // Totales
    y = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.text(`Neto: $${neto.toLocaleString('es-CL')}`, 140, y);
    y += 10;
    doc.text(`IVA (19%): $${iva.toLocaleString('es-CL')}`, 140, y);
    y += 10;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL: $${total.toLocaleString('es-CL')}`, 140, y);
    
    // Método de pago y firma
    y += 20;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Método de Pago: ${metodoPago}`, 20, y);
    y += 20;
    doc.text('___________________________', 20, y);
    y += 5;
    doc.text('Firma del Cliente', 20, y);
    
    // Pie de página
    y += 20;
    doc.setFontSize(8);
    doc.text('Esta factura es un documento válido para fines tributarios', 105, y, { align: 'center' });
    y += 5;
    doc.text('Gracias por su preferencia', 105, y, { align: 'center' });
    
    // Mostrar vista previa en nueva ventana
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
}

// Manejar el envío del formulario
document.getElementById('factura-form').addEventListener('submit', function(e) {
    e.preventDefault();
    guardarFactura();
});