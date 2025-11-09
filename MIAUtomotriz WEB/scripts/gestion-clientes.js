// gestion-clientes.js

document.addEventListener('DOMContentLoaded', function() {
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
        },
        {
            id: 3,
            nombre: 'Carlos Rodríguez Martínez',
            email: 'c.rodriguez@corporacion.com',
            telefono: '+57 320 555 8888',
            documento: '456789123',
            direccion: 'Carrera 50 #80-15, Cali',
            fechaNacimiento: '1978-11-30',
            fechaRegistro: '2024-02-01'
        }
    ];

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
        updateDateTime();
        setInterval(updateDateTime, 1000);
        renderClientesTable();
        initEventListeners();
        initSidebarToggle();
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
                    <td colspan="7" class="no-data">
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
                <td>${formatearFecha(cliente.fechaRegistro)}</td>
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
            document.getElementById('editTipoCliente').value = cliente.tipoCliente;
            
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
            cliente.documento.includes(searchTerm) ||
            cliente.tipoCliente.toLowerCase().includes(searchTerm)
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
        return new Date(fecha).toLocaleDateString('es-ES');
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

    // Sidebar toggle (reutilizar del dashboard)
    function initSidebarToggle() {
        const menuToggle = document.querySelector('.menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    sidebar.classList.toggle('active');
                } else {
                    toggleSidebar();
                }
            });
        }
        
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleSidebar();
            });
        }
        
        document.addEventListener('click', function(event) {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }

    function toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    }

    // Cargar estado de la sidebar
    function loadSidebarState() {
        const sidebar = document.querySelector('.sidebar');
        const savedState = localStorage.getItem('sidebarCollapsed');
        
        if (savedState === 'true') {
            sidebar.classList.add('collapsed');
        }
    }

    // Inicializar la aplicación
    loadSidebarState();
    init();
});