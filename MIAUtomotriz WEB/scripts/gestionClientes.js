
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
        clienteForm.addEventListener('submit', handleClienteSubmit);
        
        // Formulario de edición
        editClienteForm.addEventListener('submit', handleClienteEdit);
        
        // Botón limpiar
        btnLimpiar.addEventListener('click', limpiarFormulario);
        
        // Búsqueda
        searchInput.addEventListener('input', handleSearch);
        
        // Modal
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
        
        // Cerrar modal al hacer clic fuera
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Manejar envío del formulario
    function handleClienteSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(clienteForm);
        const nuevoCliente = {
            id: Date.now(), // ID único basado en timestamp
            nombre: formData.get('nombre'),
            email: formData.get('email'),
            telefono: formData.get('telefono'),
            documento: formData.get('documento'),
            direccion: formData.get('direccion'),
            fechaNacimiento: formData.get('fechaNacimiento'),
            fechaRegistro: new Date().toISOString().split('T')[0]
        };
        
        // Validar que no exista un cliente con el mismo documento
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
                    </div>
                </td>
            `;
            clientesTableBody.appendChild(row);
        });
        
        clientCount.textContent = clientesParaMostrar.length;
    }

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