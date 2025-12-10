document.addEventListener('DOMContentLoaded', function() {
    let empleados = JSON.parse(localStorage.getItem('empleados')) || [
        {
            id: 1,
            nombre: 'Juan Pérez',
            puesto: 'Mecanico Jefe',
            email: 'juan.perez@gmail.com',
            telefono: '555-1234',
            estado: 'active',
            fechaIngreso: '2022-03-15',
            departamento: 'Taller'
        },
        {
            id: 2,
            nombre: 'María Gómez',
            puesto: 'Asistente de Ventas',
            email: 'maria.gomez@gmail.com',
            telefono: '555-5678',
            estado: 'break',
            fechaIngreso: '2023-01-10',
            departamento: 'Ventas'
        },
        {
            id: 3,
            nombre: 'Carlos Rodríguez',
            puesto: 'Gerente',
            email: 'c.rodriguez@gmail.com',
            telefono: '555-9012',
            estado: 'vacation',
            fechaIngreso: '2020-11-05',
            departamento: 'Administración'
        },
        {
            id: 4,
            nombre: 'Ana López',
            puesto: 'Recepcionista',
            email: 'ana.lopez@gmail.com',
            telefono: '555-3456',
            estado: 'inactive',
            fechaIngreso: '2023-06-20',
            departamento: 'Atención al Cliente'
        },
        {
            id: 5,
            nombre: 'Pedro Sánchez',
            puesto: 'Mecánico',
            email: 'p.sanchez@gmail.com',
            telefono: '555-7890',
            estado: 'pending',
            fechaIngreso: '2024-01-08',
            departamento: 'Taller'
        }
    ];

    const employeeTableBody = document.getElementById('employeeTableBody');
    const searchInput = document.getElementById('searchEmpleados');
    const addEmployeeBtn = document.querySelector('.add-employee-btn');
    const employeeCount = document.getElementById('employeeCount');
    const exportBtn = document.querySelector('.btn-export');

    // Configuración de estados
    const estadosConfig = {
        'active': { texto: 'Activo', clase: 'active', icono: 'fa-check-circle' },
        'break': { texto: 'Descanso', clase: 'break', icono: 'fa-coffee' },
        'inactive': { texto: 'Inactivo', clase: 'inactive', icono: 'fa-times-circle' },
        'vacation': { texto: 'Vacaciones', clase: 'vacation', icono: 'fa-umbrella-beach' },
        'pending': { texto: 'Pendiente', clase: 'pending', icono: 'fa-clock' }
    };

    function saveToLocalStorage() {
        localStorage.setItem('empleados', JSON.stringify(empleados));
    }

    function renderEmpleadosTable(empleadosFiltrados = null) {
        const empleadosParaMostrar = empleadosFiltrados || empleados;
        
        employeeTableBody.innerHTML = '';
        
        if (empleadosParaMostrar.length === 0) {
            employeeTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">
                        <i class="fas fa-users-slash"></i>
                        No se encontraron empleados.
                    </td>
                </tr>
            `;
            employeeCount.textContent = '0';
            return;
        }
        
        empleadosParaMostrar.forEach(empleado => {
            const estadoConfig = estadosConfig[empleado.estado] || estadosConfig.active;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${empleado.id.toString().padStart(3, '0')}</td>
                <td>
                    <div class="employee-name">
                        <strong>${empleado.nombre}</strong>
                        <small>${empleado.departamento}</small>
                    </div>
                </td>
                <td>${empleado.puesto}</td>
                <td>${empleado.email}</td>
                <td>${empleado.telefono}</td>
                <td>
                    <span class="employee-status ${estadoConfig.clase} clickable" 
                          onclick="cambiarEstado(${empleado.id})"
                          title="Click para cambiar estado">
                        <div class="status-indicator">
                            <span class="status-dot ${estadoConfig.clase}"></span>
                            ${estadoConfig.texto}
                        </div>
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" title="Editar" onclick="editarEmpleado(${empleado.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" title="Eliminar" onclick="eliminarEmpleado(${empleado.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn-action btn-info" title="Más información" onclick="verDetalles(${empleado.id})">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </div>
                </td>
            `;
            employeeTableBody.appendChild(row);
        });
        
        employeeCount.textContent = empleadosParaMostrar.length;
        actualizarEstadisticas();
    }

    // Función para cambiar el estado de un empleado
    window.cambiarEstado = function(id) {
        const empleado = empleados.find(e => e.id === id);
        if (!empleado) return;

        const estados = Object.keys(estadosConfig);
        const currentIndex = estados.indexOf(empleado.estado);
        const nextIndex = (currentIndex + 1) % estados.length;
        
        empleado.estado = estados[nextIndex];
        saveToLocalStorage();
        renderEmpleadosTable();
        
        // Mostrar notificación
        mostrarNotificacion(`Estado de ${empleado.nombre} cambiado a ${estadosConfig[empleado.estado].texto}`);
    };

    // Función para mostrar estadísticas de estados
    function actualizarEstadisticas() {
        const conteoEstados = {};
        Object.keys(estadosConfig).forEach(estado => {
            conteoEstados[estado] = empleados.filter(e => e.estado === estado).length;
        });
        
        console.log('Estadísticas de empleados:', conteoEstados);
        // Aquí puedes mostrar estas estadísticas en algún lugar de la UI
    }

    // Función para mostrar notificaciones
    function mostrarNotificacion(mensaje, tipo = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `notification ${tipo}`;
        notification.innerHTML = `
            <i class="fas fa-${tipo === 'success' ? 'check' : 'info'}-circle"></i>
            <span>${mensaje}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--bg-white);
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border-left: 4px solid var(--${tipo}-color);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Función para exportar datos
    exportBtn.addEventListener('click', function() {
        const datosExportar = empleados.map(emp => ({
            ID: emp.id,
            Nombre: emp.nombre,
            Puesto: emp.puesto,
            Departamento: emp.departamento,
            Email: emp.email,
            Teléfono: emp.telefono,
            Estado: estadosConfig[emp.estado].texto,
            'Fecha Ingreso': emp.fechaIngreso
        }));
        
        console.log('Datos para exportar:', datosExportar);
        mostrarNotificacion('Datos preparados para exportar', 'success');
    });

    // Búsqueda de empleados
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        const empleadosFiltrados = empleados.filter(empleado =>
            empleado.nombre.toLowerCase().includes(query) ||
            empleado.puesto.toLowerCase().includes(query) ||
            empleado.email.toLowerCase().includes(query) ||
            empleado.telefono.toLowerCase().includes(query) ||
            (empleado.departamento && empleado.departamento.toLowerCase().includes(query))
        );
        renderEmpleadosTable(empleadosFiltrados);
    });

    // Funciones globales
    window.editarEmpleado = function(id) {
        mostrarNotificacion(`Editando empleado #${id}`, 'info');
    };

    window.eliminarEmpleado = function(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este empleado?')) {
            empleados = empleados.filter(empleado => empleado.id !== id);
            saveToLocalStorage();
            renderEmpleadosTable();
            mostrarNotificacion('Empleado eliminado correctamente', 'success');
        }
    };

    window.verDetalles = function(id) {
        const empleado = empleados.find(e => e.id === id);
        if (empleado) {
            const estado = estadosConfig[empleado.estado];
            alert(`Detalles de ${empleado.nombre}\n\nPuesto: ${empleado.puesto}\nDepartamento: ${empleado.departamento}\nEmail: ${empleado.email}\nTeléfono: ${empleado.telefono}\nEstado: ${estado.texto}\nFecha Ingreso: ${empleado.fechaIngreso}`);
        }
    };

    // Agregar empleado
    addEmployeeBtn.addEventListener('click', function() {
        const nuevoId = Math.max(...empleados.map(e => e.id), 0) + 1;
        const nuevoEmpleado = {
            id: nuevoId,
            nombre: `Nuevo Empleado ${nuevoId}`,
            puesto: 'Por asignar',
            email: `empleado${nuevoId}@miautomotriz.com`,
            telefono: '555-0000',
            estado: 'pending',
            fechaIngreso: new Date().toISOString().split('T')[0],
            departamento: 'Por asignar'
        };
        
        empleados.push(nuevoEmpleado);
        saveToLocalStorage();
        renderEmpleadosTable();
        mostrarNotificacion('Nuevo empleado agregado', 'success');
    });

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

    function init() {
        updateDateTime();
        setInterval(updateDateTime, 1000);
        renderEmpleadosTable();
    }

    init();
});