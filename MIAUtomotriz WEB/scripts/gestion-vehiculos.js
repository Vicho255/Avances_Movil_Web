// gestionVehiculos.js - Gestión completa de vehículos

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚗 Inicializando Gestión de Vehículos');
    
    // Elementos del DOM
    const vehiculosTableBody = document.getElementById('vehiculosTableBody');
    const vehiculosCount = document.getElementById('vehiculosCount');
    const searchInput = document.getElementById('searchVehiculos');
    const btnLimpiar = document.getElementById('btnLimpiar');
    const vehiculoForm = document.getElementById('vehiculoForm');
    const marcaSelect = document.getElementById('marca');
    const modeloSelect = document.getElementById('modelo');
    const btnExportar = document.getElementById('btnExportar');
    
    // Variables de estado
    let vehiculosActuales = [];
    let vehiculosFiltrados = [];
    let currentPage = 1;
    const itemsPerPage = 10;

    // ==================== INICIALIZACIÓN ====================
    async function init() {
        console.log('🔄 Iniciando aplicación...');
        
        try {
            // Cargar datos iniciales
            await Promise.all([
                cargarVehiculos(),
                inicializarEventListeners()
            ]);
            
            console.log('✅ Aplicación inicializada');
            
        } catch (error) {
            console.error('❌ Error en inicialización:', error);
            mostrarNotificacion('Error al inicializar la aplicación', 'error');
        }
    }

    // ==================== CARGAR DATOS ====================
    
    async function cargarVehiculos() {
        console.log('📡 Cargando vehículos...');
        
        // Mostrar estado de carga
        mostrarEstadoCarga();
        
        try {
            const response = await fetch('api/get-vehiculos.php', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success && Array.isArray(result.data)) {
                vehiculosActuales = result.data;
                vehiculosFiltrados = [...vehiculosActuales];
                
                console.log(`✅ ${vehiculosActuales.length} vehículos cargados`);
                mostrarVehiculos();
                
                if (vehiculosCount) {
                    vehiculosCount.textContent = result.count || vehiculosActuales.length;
                }
                
            } else {
                throw new Error(result.message || 'Error en la respuesta del servidor');
            }
            
        } catch (error) {
            console.error('❌ Error cargando vehículos:', error);
            mostrarError('Error al cargar vehículos: ' + error.message);
        }
    }

    // ==================== MOSTRAR DATOS ====================
    
    function mostrarVehiculos() {
        if (!vehiculosTableBody) return;
        
        // Calcular paginación
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const vehiculosPagina = vehiculosFiltrados.slice(startIndex, endIndex);
        
        // Limpiar tabla
        vehiculosTableBody.innerHTML = '';
        
        if (vehiculosPagina.length === 0) {
            vehiculosTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">
                        <i class="fas fa-car-alt"></i>
                        No se encontraron vehículos
                    </td>
                </tr>
            `;
            return;
        }
        
        // Crear filas
        vehiculosPagina.forEach(vehiculo => {
            const row = document.createElement('tr');
            
            // Determinar nombre del dueño
            let duenoNombre = 'No asignado';
            if (vehiculo.propietario && vehiculo.propietario.nombre) {
                duenoNombre = `${vehiculo.propietario.nombre} ${vehiculo.propietario.apellido || ''}`.trim();
            }
            
            row.innerHTML = `
                <td><strong>${escapeHTML(vehiculo.patente)}</strong></td>
                <td>${escapeHTML(vehiculo.tipo_vehiculo)}</td>
                <td>${escapeHTML(vehiculo.marca)}</td>
                <td>${escapeHTML(vehiculo.modelo)}</td>
                <td>${vehiculo.anio || '-'}</td>
                <td>${escapeHTML(vehiculo.color) || '-'}</td>
                <td>${escapeHTML(duenoNombre)}</td>
            `;
            
            // Agregar evento de clic para futuras funcionalidades
            row.addEventListener('click', () => {
                console.log('Vehículo seleccionado:', vehiculo);
            });
            
            vehiculosTableBody.appendChild(row);
        });
        
        // Actualizar controles de paginación
        actualizarPaginacion();
    }
    
    function mostrarEstadoCarga() {
        if (!vehiculosTableBody) return;
        
        vehiculosTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">
                    <i class="fas fa-spinner fa-spin"></i>
                    Cargando vehículos...
                </td>
            </tr>
        `;
    }
    
    function mostrarError(mensaje) {
        if (!vehiculosTableBody) return;
        
        vehiculosTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="error-data">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div style="margin-bottom: 10px;">${escapeHTML(mensaje)}</div>
                    <button onclick="recargarVehiculos()" class="btn-reload">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </td>
            </tr>
        `;
    }

    // ==================== FUNCIONALIDADES DEL FORMULARIO ====================
    
    async function cargarModelosPorMarca(marcaId) {
        if (!modeloSelect) return;
        
        modeloSelect.disabled = true;
        modeloSelect.innerHTML = '<option value="">Cargando modelos...</option>';
        
        if (!marcaId) {
            modeloSelect.innerHTML = '<option value="">Seleccionar modelo</option>';
            modeloSelect.disabled = true;
            return;
        }
        
        try {
            const response = await fetch(`api/get-modelos.php?marca_id=${marcaId}`);
            const result = await response.json();
            
            modeloSelect.innerHTML = '<option value="">Seleccionar modelo</option>';
            
            if (result.success && Array.isArray(result.data)) {
                result.data.forEach(modelo => {
                    const option = document.createElement('option');
                    option.value = modelo.Codigo || modelo.codigo;
                    option.textContent = modelo.Nombre || modelo.nombre;
                    modeloSelect.appendChild(option);
                });
                modeloSelect.disabled = false;
            } else {
                modeloSelect.innerHTML = '<option value="">No hay modelos disponibles</option>';
            }
            
        } catch (error) {
            console.error('Error cargando modelos:', error);
            modeloSelect.innerHTML = '<option value="">Error al cargar</option>';
        }
    }
    
    async function handleGuardarVehiculo(e) {
        e.preventDefault();
        
        if (!vehiculoForm) return;
        
        // Validar patente
        const patenteInput = document.getElementById('patente');
        const patente = patenteInput.value.trim().toUpperCase();
        
        if (!/^[A-Z]{3,4}[0-9]{3}$/.test(patente)) {
            mostrarNotificacion('Patente inválida. Use formato: ABC123 o ABCD123', 'error');
            patenteInput.focus();
            return;
        }
        
        // Validar año
        const anioInput = document.getElementById('anio');
        if (anioInput.value) {
            const currentYear = new Date().getFullYear();
            const anio = parseInt(anioInput.value);
            if (anio < 1900 || anio > currentYear + 1) {
                mostrarNotificacion(`El año debe estar entre 1900 y ${currentYear + 1}`, 'error');
                anioInput.focus();
                return;
            }
        }
        
        // Preparar datos
        const formData = new FormData(vehiculoForm);
        const datos = {
            patente: patente,
            tipo_vehiculo_id: formData.get('tipo_vehiculo_id') || null,
            marca_id: formData.get('marca_id') || null,
            modelo_id: formData.get('modelo_id') || null,
            anio: formData.get('anio') || null,
            color: formData.get('color') || null,
            persona_rut: formData.get('persona_rut') || null
        };
        
        console.log('Enviando datos:', datos);
        
        // Mostrar estado de carga
        const submitBtn = vehiculoForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('api/guardar-vehiculo.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(datos)
            });
            
            const result = await response.json();
            
            if (result.success) {
                mostrarNotificacion('✅ Vehículo guardado exitosamente', 'success');
                vehiculoForm.reset();
                modeloSelect.disabled = true;
                modeloSelect.innerHTML = '<option value="">Seleccionar modelo</option>';
                
                // Recargar lista
                await cargarVehiculos();
                
            } else {
                mostrarNotificacion(`❌ ${result.message || 'Error al guardar'}`, 'error');
            }
            
        } catch (error) {
            console.error('Error guardando vehículo:', error);
            mostrarNotificacion('❌ Error de conexión al servidor', 'error');
            
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    // ==================== BÚSQUEDA Y FILTROS ====================
    
    function handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            vehiculosFiltrados = [...vehiculosActuales];
        } else {
            vehiculosFiltrados = vehiculosActuales.filter(vehiculo => {
                return (
                    (vehiculo.patente && vehiculo.patente.toLowerCase().includes(searchTerm)) ||
                    (vehiculo.marca && vehiculo.marca.toLowerCase().includes(searchTerm)) ||
                    (vehiculo.modelo && vehiculo.modelo.toLowerCase().includes(searchTerm)) ||
                    (vehiculo.tipo_vehiculo && vehiculo.tipo_vehiculo.toLowerCase().includes(searchTerm)) ||
                    (vehiculo.color && vehiculo.color.toLowerCase().includes(searchTerm)) ||
                    (vehiculo.propietario && vehiculo.propietario.nombre && 
                     vehiculo.propietario.nombre.toLowerCase().includes(searchTerm))
                );
            });
        }
        
        currentPage = 1; // Volver a primera página
        mostrarVehiculos();
        
        if (vehiculosCount) {
            vehiculosCount.textContent = vehiculosFiltrados.length;
        }
    }

    // ==================== PAGINACIÓN ====================
    
    function actualizarPaginacion() {
        const totalPages = Math.ceil(vehiculosFiltrados.length / itemsPerPage);
        const currentPageElement = document.getElementById('currentPage');
        const btnPrev = document.getElementById('btnPrev');
        const btnNext = document.getElementById('btnNext');
        
        if (currentPageElement) {
            currentPageElement.textContent = currentPage;
        }
        
        if (btnPrev) {
            btnPrev.disabled = currentPage <= 1;
        }
        
        if (btnNext) {
            btnNext.disabled = currentPage >= totalPages;
        }
        
        // Actualizar texto de información
        const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, vehiculosFiltrados.length);
        const endItem = Math.min(currentPage * itemsPerPage, vehiculosFiltrados.length);
        
        if (vehiculosCount) {
            vehiculosCount.textContent = `${startItem}-${endItem} de ${vehiculosFiltrados.length}`;
        }
    }
    
    function cambiarPagina(direccion) {
        const totalPages = Math.ceil(vehiculosFiltrados.length / itemsPerPage);
        
        if (direccion === 'prev' && currentPage > 1) {
            currentPage--;
        } else if (direccion === 'next' && currentPage < totalPages) {
            currentPage++;
        }
        
        mostrarVehiculos();
    }

    // ==================== EXPORTACIÓN ====================
    
    function exportarVehiculos() {
        if (vehiculosFiltrados.length === 0) {
            mostrarNotificacion('No hay datos para exportar', 'warning');
            return;
        }
        
        // Crear contenido CSV
        let csvContent = "Patente,Tipo,Marca,Modelo,Año,Color,Dueño\n";
        
        vehiculosFiltrados.forEach(vehiculo => {
            const duenoNombre = vehiculo.propietario ? 
                `${vehiculo.propietario.nombre} ${vehiculo.propietario.apellido || ''}`.trim() : 
                'No asignado';
            
            const row = [
                vehiculo.patente || '',
                vehiculo.tipo_vehiculo || '',
                vehiculo.marca || '',
                vehiculo.modelo || '',
                vehiculo.anio || '',
                vehiculo.color || '',
                duenoNombre
            ].map(field => `"${field}"`).join(',');
            
            csvContent += row + "\n";
        });
        
        // Crear y descargar archivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        link.setAttribute("href", url);
        link.setAttribute("download", `vehiculos_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        mostrarNotificacion(`✅ Exportados ${vehiculosFiltrados.length} vehículos`, 'success');
    }

    // ==================== EVENT LISTENERS ====================
    
    function inicializarEventListeners() {
        // Formulario
        if (vehiculoForm) {
            vehiculoForm.addEventListener('submit', handleGuardarVehiculo);
            
            // Validar patente en tiempo real
            const patenteInput = document.getElementById('patente');
            if (patenteInput) {
                patenteInput.addEventListener('input', function() {
                    this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                });
            }
        }
        
        // Select de marca - cargar modelos
        if (marcaSelect) {
            marcaSelect.addEventListener('change', function() {
                cargarModelosPorMarca(this.value);
            });
        }
        
        // Botón limpiar
        if (btnLimpiar) {
            btnLimpiar.addEventListener('click', () => {
                if (vehiculoForm) {
                    vehiculoForm.reset();
                    modeloSelect.disabled = true;
                    modeloSelect.innerHTML = '<option value="">Seleccionar modelo</option>';
                    mostrarNotificacion('Formulario limpiado', 'info');
                }
            });
        }
        
        // Búsqueda
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
        }
        
        // Paginación
        const btnPrev = document.getElementById('btnPrev');
        const btnNext = document.getElementById('btnNext');
        
        if (btnPrev) {
            btnPrev.addEventListener('click', () => cambiarPagina('prev'));
        }
        if (btnNext) {
            btnNext.addEventListener('click', () => cambiarPagina('next'));
        }
        
        // Exportar
        if (btnExportar) {
            btnExportar.addEventListener('click', exportarVehiculos);
        }
        
        // Eventos de teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && searchInput.value) {
                searchInput.value = '';
                handleSearch({ target: searchInput });
            }
        });
    }

    // ==================== FUNCIONES AUXILIARES ====================
    
    function mostrarNotificacion(mensaje, tipo = 'info', duracion = 5000) {
        console.log(`[${tipo}] ${mensaje}`);
        
        // Crear elemento de notificación
        const notificacion = document.createElement('div');
        notificacion.className = 'notification';
        notificacion.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                background-color: ${tipo === 'success' ? '#10b981' : 
                                tipo === 'error' ? '#ef4444' : 
                                tipo === 'warning' ? '#f59e0b' : '#3b82f6'};
                color: white;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 9999;
                animation: slideIn 0.3s ease-out;
            ">
                ${mensaje}
            </div>
        `;
        
        document.body.appendChild(notificacion);
        
        // Auto-remover
        setTimeout(() => {
            notificacion.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => {
                if (notificacion.parentNode) {
                    notificacion.parentNode.removeChild(notificacion);
                }
            }, 300);
        }, duracion);
        
        // Permitir cerrar con clic
        notificacion.addEventListener('click', () => {
            notificacion.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => {
                if (notificacion.parentNode) {
                    notificacion.parentNode.removeChild(notificacion);
                }
            }, 300);
        });
        
        // Agregar estilos CSS si no existen
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    // Función global para recargar
    window.recargarVehiculos = cargarVehiculos;
    
    // ==================== INICIAR APLICACIÓN ====================
    init();
});