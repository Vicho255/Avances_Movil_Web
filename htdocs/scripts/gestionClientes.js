document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 INICIANDO DEBUG');
    // Datos de ejemplo
    let clientes = JSON.parse(localStorage.getItem('clientes')) || [
        {
            id: 1,
            nombre: 'Juan Pérez García',
            email: 'juan.perez@email.com',
            telefono: '+57 300 123 4567',
            documento: '123456789',
            direccion: 'Calle 123 #45-67, Bogotá',
            fechaNacimiento: '1985-03-15',
            fechaRegistro: '2024-01-15'
        },
        {
            id: 2,
            nombre: 'María López Hernández',
            email: 'maria.lopez@empresa.com',
            telefono: '+57 310 987 6543',
            documento: '987654321',
            direccion: 'Av. Principal #100-23, Medellín',
            fechaNacimiento: '1990-07-22',
            fechaRegistro: '2024-01-20'
        }
    ];

    console.log('📦 localStorage clientes:', localStorage.getItem('clientes'));
    console.log('👥 Array clientes:', clientes);
    console.log('🔢 Número de clientes:', clientes.length);

    // Elementos del DOM
    const clienteForm = document.getElementById('clienteForm');
    const editClienteForm = document.getElementById('editClienteForm');
    const clientesTableBody = document.getElementById('clientesTableBody');
    const clientCount = document.getElementById('clientCount');
    const searchInput = document.getElementById('searchClientes');
    const btnLimpiar = document.getElementById('btnLimpiar');
    const modal = document.getElementById('editModal');
    const btnExportarPDF = document.getElementById('btnexportar');

    // Inicializar la aplicación
    function init() {
        console.log('Clientes cargados:', clientes);
        updateDateTime();
        setInterval(updateDateTime, 1000);
        renderClientesTable();
        initEventListeners();
    }

    // Actualizar fecha y hora
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
        document.getElementById('currentDateTime').textContent = 
            now.toLocaleDateString('es-ES', options);
    }

    // Inicializar event listeners
    function initEventListeners() {
        // Formulario de nuevo cliente
        if (clienteForm) clienteForm.addEventListener('submit', handleClienteSubmit);
        
        // Formulario de edición
        if (editClienteForm) editClienteForm.addEventListener('submit', handleClienteEdit);
        
        // Botón limpiar
        if (btnLimpiar) btnLimpiar.addEventListener('click', limpiarFormulario);
        
        // Búsqueda
        if (searchInput) searchInput.addEventListener('input', handleSearch);
        
        // Modal
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
        
        // Cerrar modal al hacer clic fuera
        if (modal) modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Botón exportar PDF
        if (btnExportarPDF) btnExportarPDF.addEventListener('click', exportarClientesPDF);
    }

    // FUNCIÓN PARA EXPORTAR A PDF
    function exportarClientesPDF() {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Obtener clientes actuales (pueden estar filtrados por búsqueda)
            const clientesParaExportar = clientes;
            
            // Título
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text("LISTA DE CLIENTES", 105, 15, { align: 'center' });
            
            // Información de la empresa/encabezado
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("Sistema de Gestión de Clientes", 105, 25, { align: 'center' });
            doc.text(`Generado: ${new Date().toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}`, 105, 32, { align: 'center' });
            
            doc.text(`Total de clientes: ${clientesParaExportar.length}`, 105, 39, { align: 'center' });
            
            // Preparar datos para la tabla
            const headers = [["#", "Nombre", "Email", "Teléfono", "Documento", "Fecha Registro", "Dirección"]];
            
            const data = clientesParaExportar.map((cliente, index) => [
                index + 1,
                cliente.nombre,
                cliente.email,
                cliente.telefono,
                cliente.documento,
                cliente.fechaRegistro,
                cliente.direccion || 'N/A'
            ]);
            
            // Crear tabla con autoTable
            doc.autoTable({
                head: headers,
                body: data,
                startY: 45,
                theme: 'striped',
                styles: {
                    fontSize: 9,
                    cellPadding: 2,
                    overflow: 'linebreak'
                },
                headStyles: {
                    fillColor: [41, 128, 185],
                    textColor: 255,
                    fontSize: 10,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                },
                columnStyles: {
                    0: { cellWidth: 10 }, // #
                    1: { cellWidth: 40 }, // Nombre
                    2: { cellWidth: 40 }, // Email
                    3: { cellWidth: 30 }, // Teléfono
                    4: { cellWidth: 30 }, // Documento
                    5: { cellWidth: 25 }, // Fecha
                    6: { cellWidth: 'auto' } // Dirección
                },
                margin: { top: 45 },
                didDrawPage: function(data) {
                    // Pie de página
                    doc.setFontSize(8);
                    doc.setTextColor(128);
                    doc.text(
                        `Página ${doc.internal.getNumberOfPages()}`,
                        doc.internal.pageSize.width / 2,
                        doc.internal.pageSize.height - 10,
                        { align: 'center' }
                    );
                }
            });
            
            // Guardar el PDF con nombre personalizado
            const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            doc.save(`clientes_${fecha}.pdf`);
            
            showNotification('PDF generado exitosamente', 'success');
            
        } catch (error) {
            console.error('Error al generar PDF:', error);
            showNotification('Error al generar el PDF', 'error');
        }
    }

    // VERSIÓN AVANZADA CON MÁS DETALLES
    window.exportarClientesDetalladoPDF = function() {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Título principal
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(41, 128, 185);
            doc.text("REPORTE DE CLIENTES", 105, 20, { align: 'center' });
            
            // Información del reporte
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0);
            doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}`, 105, 30, { align: 'center' });
            
            // Estadísticas
            doc.setFont("helvetica", "bold");
            doc.text(`Total de clientes: ${clientes.length}`, 20, 45);
            
            // Preparar datos para la tabla
            const headers = [["N°", "NOMBRE COMPLETO", "EMAIL", "TELÉFONO", "DOCUMENTO", "FECHA REGISTRO"]];
            
            const data = clientes.map((cliente, index) => [
                index + 1,
                cliente.nombre,
                cliente.email,
                cliente.telefono,
                cliente.documento,
                formatearFecha(cliente.fechaRegistro)
            ]);
            
            // Crear tabla
            doc.autoTable({
                head: headers,
                body: data,
                startY: 55,
                theme: 'grid',
                styles: {
                    fontSize: 8,
                    cellPadding: 3,
                    lineColor: [200, 200, 200],
                    lineWidth: 0.1
                },
                headStyles: {
                    fillColor: [52, 152, 219],
                    textColor: 255,
                    fontSize: 9,
                    fontStyle: 'bold',
                    halign: 'center'
                },
                bodyStyles: {
                    halign: 'left'
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 15 },
                    5: { halign: 'center', cellWidth: 25 }
                },
                margin: { top: 55 },
                didDrawPage: function(data) {
                    // Encabezado en cada página
                    if (data.pageNumber > 1) {
                        doc.setFontSize(10);
                        doc.setFont("helvetica", "bold");
                        doc.text("CONTINUACIÓN - LISTA DE CLIENTES", 105, 15, { align: 'center' });
                    }
                    
                    // Pie de página
                    doc.setFontSize(7);
                    doc.setTextColor(128);
                    doc.text(
                        `Página ${data.pageNumber} de ${data.pageCount}`,
                        doc.internal.pageSize.width / 2,
                        doc.internal.pageSize.height - 10,
                        { align: 'center' }
                    );
                }
            });
            
            const finalY = doc.lastAutoTable.finalY || 100;
            
            // Información adicional
            doc.setFontSize(9);
            doc.setFont("helvetica", "italic");
            doc.text("Este reporte fue generado automáticamente por el Sistema de Gestión de Clientes", 
                    105, finalY + 15, { align: 'center' });
            
            // Guardar el PDF
            const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const hora = new Date().getHours().toString().padStart(2, '0') + 
                        new Date().getMinutes().toString().padStart(2, '0');
            doc.save(`reporte_clientes_${fecha}_${hora}.pdf`);
            
            showNotification('Reporte detallado generado exitosamente', 'success');
            
        } catch (error) {
            console.error('Error al generar reporte PDF:', error);
            showNotification('Error al generar el reporte', 'error');
        }
    };

    // Manejar envío del formulario
    function handleClienteSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(clienteForm);
        const nuevoCliente = {
            id: Date.now(),
            nombre: formData.get('nombre'),
            email: formData.get('email'),
            telefono: formData.get('telefono'),
            documento: formData.get('documento'),
            direccion: formData.get('direccion'),
            fechaNacimiento: formData.get('fechaNacimiento'),
            fechaRegistro: new Date().toISOString().split('T')[0]
        };
        
        const clienteExistente = clientes.find(cliente => 
            cliente.documento === nuevoCliente.documento
        );
        
        if (clienteExistente) {
            showNotification('Ya existe un cliente con este documento', 'error');
            return;
        }
        
        clientes.unshift(nuevoCliente);
        guardarClientes();
        renderClientesTable();
        limpiarFormulario();
        showNotification('Cliente registrado exitosamente', 'success');
    }

    // Manejar edición de cliente
    function handleClienteEdit(e) {
        e.preventDefault();
        
        const formData = new FormData(editClienteForm);
        const clienteId = parseInt(document.getElementById('editClienteId').value);
        
        const clienteIndex = clientes.findIndex(cliente => cliente.id === clienteId);
        
        if (clienteIndex !== -1) {
            clientes[clienteIndex] = {
                ...clientes[clienteIndex],
                nombre: formData.get('nombre'),
                email: formData.get('email'),
                telefono: formData.get('telefono'),
                documento: formData.get('documento'),
                direccion: formData.get('direccion')
            };
            
            guardarClientes();
            renderClientesTable();
            closeModal();
            showNotification('Cliente actualizado exitosamente', 'success');
        }
    }

    // Renderizar tabla de clientes
    function renderClientesTable(clientesFiltrados = null) {
        const clientesParaMostrar = clientesFiltrados || clientes;
        
        clientesTableBody.innerHTML = '';
        
        if (clientesParaMostrar.length === 0) {
            clientesTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">
                        <i class="fas fa-users-slash"></i>
                        No se encontraron clientes
                    </td>
                </tr>
            `;
            clientCount.textContent = '0';
            return;
        }
        
        clientesParaMostrar.forEach(cliente => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${cliente.nombre}</td>
                <td>${cliente.email}</td>
                <td>${cliente.telefono}</td>
                <td>${cliente.documento}</td>
                <td>${cliente.fechaRegistro}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" onclick="editarCliente(${cliente.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="eliminarCliente(${cliente.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn-action btn-pdf" onclick="exportarClienteIndividualPDF(${cliente.id})" title="Exportar a PDF">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                    </div>
                </td>
            `;
            clientesTableBody.appendChild(row);
        });
        
        clientCount.textContent = clientesParaMostrar.length;
    }

    // Exportar cliente individual a PDF
    window.exportarClienteIndividualPDF = function(id) {
        try {
            const cliente = clientes.find(c => c.id === id);
            if (!cliente) {
                showNotification('Cliente no encontrado', 'error');
                return;
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Encabezado
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(41, 128, 185);
            doc.text("FICHA DE CLIENTE", 105, 20, { align: 'center' });
            
            // Línea decorativa
            doc.setDrawColor(41, 128, 185);
            doc.setLineWidth(0.5);
            doc.line(20, 25, 190, 25);
            
            // Información del cliente
            const startY = 35;
            let currentY = startY;
            
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0);
            
            const addField = (label, value, y) => {
                doc.setFont("helvetica", "bold");
                doc.text(`${label}:`, 25, y);
                doc.setFont("helvetica", "normal");
                const lines = doc.splitTextToSize(value || 'No especificado', 150);
                doc.text(lines, 80, y);
                return y + (lines.length * 7) + 5;
            };
            
            currentY = addField("Nombre completo", cliente.nombre, currentY);
            currentY = addField("Documento", cliente.documento, currentY);
            currentY = addField("Email", cliente.email, currentY);
            currentY = addField("Teléfono", cliente.telefono, currentY);
            
            if (cliente.direccion) {
                currentY = addField("Dirección", cliente.direccion, currentY);
            }
            
            if (cliente.fechaNacimiento) {
                currentY = addField("Fecha de nacimiento", 
                    formatearFecha(cliente.fechaNacimiento), currentY);
            }
            
            currentY = addField("Fecha de registro", 
                formatearFecha(cliente.fechaRegistro), currentY);
            
            // Código QR o información adicional
            currentY += 10;
            doc.setFont("helvetica", "italic");
            doc.setFontSize(8);
            doc.text(`ID del cliente: ${cliente.id}`, 25, currentY);
            
            // Pie de página
            currentY = 280;
            doc.setFontSize(7);
            doc.setTextColor(128);
            doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 
                    105, currentY, { align: 'center' });
            
            // Guardar PDF
            const nombreArchivo = cliente.nombre.toLowerCase()
                .replace(/[^a-z0-9]/g, '_')
                .substring(0, 20);
            doc.save(`cliente_${nombreArchivo}.pdf`);
            
            showNotification('Ficha del cliente generada exitosamente', 'success');
            
        } catch (error) {
            console.error('Error al generar ficha PDF:', error);
            showNotification('Error al generar la ficha', 'error');
        }
    };

    // Editar cliente
    window.editarCliente = function(id) {
        const cliente = clientes.find(c => c.id === id);
        
        if (cliente) {
            document.getElementById('editClienteId').value = cliente.id;
            document.getElementById('editNombre').value = cliente.nombre;
            document.getElementById('editEmail').value = cliente.email;
            document.getElementById('editTelefono').value = cliente.telefono;
            document.getElementById('editDocumento').value = cliente.documento;
            document.getElementById('editDireccion').value = cliente.direccion || '';
            
            modal.style.display = 'block';
        }
    };

    // Eliminar cliente
    window.eliminarCliente = function(id) {
        if (confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
            clientes = clientes.filter(cliente => cliente.id !== id);
            guardarClientes();
            renderClientesTable();
            showNotification('Cliente eliminado exitosamente', 'success');
        }
    };

    // Manejar búsqueda
    function handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        
        if (searchTerm.trim() === '') {
            renderClientesTable();
            return;
        }
        
        const clientesFiltrados = clientes.filter(cliente =>
            cliente.nombre.toLowerCase().includes(searchTerm) ||
            cliente.email.toLowerCase().includes(searchTerm) ||
            cliente.telefono.includes(searchTerm) ||
            cliente.documento.includes(searchTerm)
        );
        
        renderClientesTable(clientesFiltrados);
    }

    // Limpiar formulario
    function limpiarFormulario() {
        clienteForm.reset();
    }

    // Cerrar modal
    function closeModal() {
        modal.style.display = 'none';
        editClienteForm.reset();
    }

    // Guardar clientes en localStorage
    function guardarClientes() {
        localStorage.setItem('clientes', JSON.stringify(clientes));
    }

    // Formatear fecha
    function formatearFecha(fecha) {
        if (!fecha || fecha === 'Invalid Date') {
            return 'Fecha no válida';
        }
        
        try {
            const fechaObj = new Date(fecha);
            if (isNaN(fechaObj.getTime())) {
                return 'Fecha no válida';
            }
            return fechaObj.toLocaleDateString('es-ES');
        } catch (error) {
            console.error('Error al formatear fecha:', error);
            return 'Fecha no válida';
        }
    }

    // Mostrar notificación
    function showNotification(mensaje, tipo = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${tipo}`;
        notification.textContent = mensaje;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Inicializar la aplicación
    init();
});