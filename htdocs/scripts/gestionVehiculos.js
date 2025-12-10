document.addEventListener('DOMContentLoaded', function() {

    let vehiculos = JSON.parse(localStorage.getItem('vehiculos')) || [
        { patente: 'GK SB 78', marca: 'Toyota', modelo: 'Corolla', tipo: 'SUV',anno: 2020},
        { patente: 'PT CL 21', marca: 'Honda', modelo: 'Civic', tipo: 'SUV',anno: 2019}
    ];

    const vehiculoForm = document.getElementById('vehiculoForm');
    const vehiculosTableBody = document.getElementById('carsTableBody');
    const carsCount = document.getElementById('carsCount');
    const searchInput = document.getElementById('searchvehiculo');

    function init() {
        updateDateTime();
        setInterval(updateDateTime, 1000);
        renderVehiculoTable();
        initEventListeners();
        formatearFecha();
    }

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
        vehiculoForm.addEventListener('submit', handleVehiculoSubmit);
        
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
    function handleVehiculoSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(vehiculoForm);
        const nuevoVehiculo = {
            id: Date.now(), // ID único basado en timestamp
            patente: formData.get('patente'),
            marca: formData.get('marca'),
            modelo: formData.get('modelo'),
            tipo: formData.get('tipo'),
            anno: formData.get('anno'),
        };
        
        // Validar que no exista un cliente con el mismo documento
        const vehiculoExistente = vehiculos.find(vehiculo => 
            vehiculo.patente === nuevoVehiculo.patente
        );
        
        if (vehiculoExistente) {
            showNotification('Ya existe un vehiculo con esta patente', 'error');
            return;
        }
        
        vehiculos.unshift(nuevoVehiculo);
        guardarVehiculo();
        renderVehiculoTable();
        limpiarFormulario();
        showNotification('Vehiculo registrado exitosamente', 'success');
    }

    
    // Renderizar tabla de clientes
    function renderVehiculoTable(vehiculosFiltrados = null) {
        const vehiculosParaMostrar = vehiculosFiltrados || vehiculos;
        
        vehiculosTableBody.innerHTML = '';
        
        if (vehiculosParaMostrar.length === 0) {
            vehiculosTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">
                        <i class="fas fa-users-slash"></i>
                        No se encontraron vehiculos
                    </td>
                </tr>
            `;
            carsCount.textContent = '0';
            return;
        }
        
        vehiculosParaMostrar.forEach(vehiculo => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${vehiculo.patente}</td>
                <td>${vehiculo.marca}</td>
                <td>${vehiculo.modelo}</td>
                <td>${vehiculo.tipo}</td>
                <td>${vehiculo.anno}</td>
                <td>Disponible</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-delete" onclick="eliminarVehiculo(${vehiculo.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            vehiculosTableBody.appendChild(row);
        });
        
        carsCount.textContent = vehiculosParaMostrar.length;
    }


    // Eliminar cliente
    window.eliminarVehiculo = function(id) {
        if (confirm('¿Estás seguro de que deseas eliminar este Vehiculo?')) {
            vehiculos = vehiculos.filter(vehiculo => vehiculo.id !== id);
            guardarVehiculo();
            renderVehiculoTable();
            showNotification('Vehiculo eliminado exitosamente', 'success');
        }
    };

    // Manejar búsqueda
    function handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        
        if (searchTerm.trim() === '') {
            renderVehiculoTable();
            return;
        }
        
        const vehicuolosFiltrados = vehiculos.filter(vehiculo =>
            vehiculo.patente.toLowerCase().includes(searchTerm) ||
            vehiculo.marca.toLowerCase().includes(searchTerm) ||
            vehiculo.modelo.toLowerCase().includes(searchTerm) ||
            vehiculo.tipo.toLowerCase().includes(searchTerm) ||
            vehiculo.anno.toString().includes(searchTerm)
        );
        
        renderClientesTable(vehicuolosFiltrados);
    }

    // Limpiar formulario
    function limpiarFormulario() {
        vehiculoForm.reset();
    }

    // Cerrar modal
    function closeModal() {
        modal.style.display = 'none';
        editClienteForm.reset();
    }

    // Guardar clientes en localStorage
    function guardarVehiculo() {
        localStorage.setItem('clientes', JSON.stringify(vehiculos));
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

    init();
});
