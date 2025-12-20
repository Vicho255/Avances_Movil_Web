// gestionVehiculos.js - Versión adaptada para vehículos

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Inicializando Gestión de Vehículos');
    
    // Elementos del DOM
    const vehiculosTableBody = document.getElementById('vehiculosTableBody');
    const vehiculosCount = document.getElementById('vehiculosCount');
    const searchInput = document.getElementById('searchVehiculos');
    const btnLimpiar = document.getElementById('btnLimpiar');
    const vehiculoForm = document.getElementById('vehiculoForm');

    // Variables para almacenar datos
    let vehiculosActuales = [];
    let tiposVehiculos = [];
    let marcas = [];
    let modelos = [];

    // ==================== INICIALIZACIÓN ====================
    // Inicializar la aplicación
    async function init() {
        console.log('🚀 Iniciando aplicación de vehículos...');
        updateDateTime();
        setInterval(updateDateTime, 1000);
        
        try {
            // Cargar datos en paralelo
            await Promise.all([
                cargarVehiculosDesdeBD(),
                cargarTiposVehiculos(),
                cargarMarcas()
            ]);
            
            // Cargar modelos iniciales (todos o según marca seleccionada)
            const marcaSelect = document.getElementById('marca');
            if (marcaSelect && marcaSelect.value && marcaSelect.value !== 'Susuki') {
                await cargarModelosPorMarca();
            } else {
                await cargarModelos();
            }
            
            initEventListeners();
            initThemeStyles();
            
        } catch (error) {
            console.error('❌ Error en inicialización:', error);
            mostrarNotificacion('Error al inicializar la aplicación', 'error');
        }
    }

    // ==================== EVENT LISTENERS ====================
    function initEventListeners() {
        console.log('🎯 Configurando event listeners...');
        
        // Botón limpiar
        if (btnLimpiar) {
            btnLimpiar.addEventListener('click', limpiarFormulario);
        }
        
        // Búsqueda
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
        }
        
        // Formulario de vehículo
        if (vehiculoForm) {
            vehiculoForm.addEventListener('submit', handleGuardarVehiculo);
            
            // Validar patente en tiempo real
            const patenteInput = document.getElementById('patente');
            if (patenteInput) {
                patenteInput.addEventListener('input', function() {
                    this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                });
            }
            
            // Validar año
            const anioInput = document.getElementById('anio');
            if (anioInput) {
                const currentYear = new Date().getFullYear();
                anioInput.min = 1900;
                anioInput.max = currentYear + 1;
                anioInput.addEventListener('change', function() {
                    if (this.value < 1900 || this.value > currentYear + 1) {
                        mostrarNotificacion(`El año debe estar entre 1900 y ${currentYear + 1}`, 'error');
                    }
                });
            }
        }
        
        // Escuchar cambios de tema
        document.addEventListener('themeChanged', function(e) {
            const isDarkMode = e.detail.theme === 'dark';
            applyTableStyles(isDarkMode);
        });
    }

    function initThemeStyles() {
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        applyTableStyles(isDarkMode);
    }

    function applyTableStyles(isDarkMode) {
        const table = document.querySelector('.clients-table');
        if (table) {
            table.style.borderColor = isDarkMode ? '#4b5563' : '#e5e7eb';
        }
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
        const element = document.getElementById('currentDateTime');
        if (element) {
            element.textContent = now.toLocaleDateString('es-ES', options);
        }
    }

    // ==================== FUNCIONES PARA CARGAR DATOS ====================

    // Cargar tipos de vehículos
    async function cargarTiposVehiculos() {
        console.log('🏍️ Cargando tipos de vehículos desde API...');
        
        const select = document.getElementById('tipo_vehiculo');
        if (!select) {
            console.error('❌ ERROR: Select de tipos de vehículos no encontrado');
            return;
        }
        
        try {
            const response = await fetch('api/get-tipos-vehiculo.php', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                credentials: 'same-origin'
            });
            
            console.log('📊 Status tipos:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success && Array.isArray(result.data)) {
                tiposVehiculos = result.data;
                
                // Guardar opción por defecto
                const defaultOption = select.options[0];
                
                // Limpiar todas las opciones
                select.innerHTML = '';
                
                // Agregar opción por defecto
                select.appendChild(defaultOption);
                
                // Agregar opciones desde la API
                result.data.forEach(tipo => {
                    const option = document.createElement('option');
                    option.value = tipo.Codigo || tipo.codigo || '';
                    option.textContent = tipo.Nombre || tipo.nombre || 'Sin nombre';
                    select.appendChild(option);
                });
                
                console.log(`✅ ${tiposVehiculos.length} tipos de vehículos cargados`);
                return tiposVehiculos;
            } else {
                console.warn('⚠️ No se recibieron datos de tipos de vehículos');
                mostrarNotificacion('No se pudieron cargar los tipos de vehículos', 'warning');
                return [];
            }
            
        } catch (error) {
            console.error('❌ Error cargando tipos de vehículos:', error);
            mostrarNotificacion('Error al cargar tipos de vehículos', 'error');
            return [];
        }
    }

    // Cargar marcas
    async function cargarMarcas() {
        console.log('🚗 Cargando marcas desde API...');
        
        const select = document.getElementById('marca');
        if (!select) {
            console.error('❌ ERROR: Select de marcas no encontrado');
            return;
        }
        
        try {
            const response = await fetch('api/get-marcas.php', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                credentials: 'same-origin'
            });
            
            console.log('📊 Status marcas:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success && Array.isArray(result.data)) {
                marcas = result.data;
                
                // Guardar opción por defecto
                const defaultOption = select.options[0];
                
                // Limpiar todas las opciones
                select.innerHTML = '';
                
                // Agregar opción por defecto
                select.appendChild(defaultOption);
                
                // Agregar opciones desde la API
                result.data.forEach(marca => {
                    const option = document.createElement('option');
                    option.value = marca.Codigo || marca.codigo || '';
                    option.textContent = marca.Nombre || marca.nombre || 'Sin nombre';
                    select.appendChild(option);
                });
                
                // Agregar evento para cargar modelos cuando cambie la marca
                select.addEventListener('change', cargarModelosPorMarca);
                
                console.log(`✅ ${marcas.length} marcas cargadas`);
                return marcas;
            } else {
                console.warn('⚠️ No se recibieron datos de marcas');
                mostrarNotificacion('No se pudieron cargar las marcas', 'warning');
                return [];
            }
            
        } catch (error) {
            console.error('❌ Error cargando marcas:', error);
            mostrarNotificacion('Error al cargar marcas', 'error');
            return [];
        }
    }

    // Cargar modelos según marca seleccionada
    async function cargarModelosPorMarca() {
        const marcaSelect = document.getElementById('marca');
        if (!marcaSelect) return;
        
        const marcaId = marcaSelect.value;
        
        // Si no hay marca seleccionada o es el valor por defecto, limpiar modelos
        if (!marcaId || marcaId === '' || marcaId === 'Susuki') {
            const modeloSelect = document.getElementById('modelo');
            if (modeloSelect) {
                // Limpiar excepto la primera opción
                while (modeloSelect.options.length > 1) {
                    modeloSelect.remove(1);
                }
            }
            return;
        }
        
        console.log(`📱 Cargando modelos para marca ID: ${marcaId}...`);
        
        try {
            // Agregar timestamp para evitar caché
            const timestamp = new Date().getTime();
            const url = `api/get-modelos.php?marca_id=${marcaId}&t=${timestamp}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                credentials: 'same-origin'
            });
            
            console.log('📊 Status modelos:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            const modeloSelect = document.getElementById('modelo');
            if (modeloSelect) {
                // Guardar opción por defecto
                const defaultOption = modeloSelect.options[0];
                
                // Limpiar todas las opciones
                modeloSelect.innerHTML = '';
                
                // Agregar opción por defecto
                modeloSelect.appendChild(defaultOption);
                
                if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                    // Agregar opciones desde la API
                    result.data.forEach(modelo => {
                        const option = document.createElement('option');
                        option.value = modelo.Codigo || modelo.codigo || '';
                        option.textContent = modelo.Nombre || modelo.nombre || 'Sin nombre';
                        modeloSelect.appendChild(option);
                    });
                    
                    console.log(`✅ ${result.data.length} modelos cargados para marca ${marcaId}`);
                    
                    // Actualizar variable global de modelos
                    modelos = result.data;
                    
                } else {
                    // Si no hay modelos, agregar opción de "Sin modelos"
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = '-- No hay modelos disponibles --';
                    option.disabled = true;
                    option.selected = true;
                    modeloSelect.appendChild(option);
                    
                    console.log(`ℹ️ No hay modelos para la marca ${marcaId}`);
                    mostrarNotificacion('No hay modelos disponibles para esta marca', 'info', 3000);
                    modelos = [];
                }
            }
            
        } catch (error) {
            console.error('❌ Error cargando modelos:', error);
            
            const modeloSelect = document.getElementById('modelo');
            if (modeloSelect) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Error al cargar modelos';
                option.disabled = true;
                option.selected = true;
                modeloSelect.appendChild(option);
            }
            
            mostrarNotificacion('Error al cargar modelos', 'error');
        }
    }

    // Cargar todos los modelos (sin filtro por marca)
    async function cargarModelos() {
        console.log('📱 Cargando todos los modelos...');
        
        try {
            const response = await fetch('api/get-modelos.php', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success && Array.isArray(result.data)) {
                modelos = result.data;
                
                const select = document.getElementById('modelo');
                if (select) {
                    // Guardar opción por defecto
                    const defaultOption = select.options[0];
                    
                    // Limpiar todas las opciones
                    select.innerHTML = '';
                    
                    // Agregar opción por defecto
                    select.appendChild(defaultOption);
                    
                    // Agregar opciones desde la API
                    result.data.forEach(modelo => {
                        const option = document.createElement('option');
                        option.value = modelo.Codigo || modelo.codigo || '';
                        option.textContent = modelo.Nombre || modelo.nombre || 'Sin nombre';
                        select.appendChild(option);
                    });
                }
                
                console.log(`✅ ${modelos.length} modelos cargados`);
                return modelos;
            }
            
        } catch (error) {
            console.error('❌ Error cargando modelos:', error);
            mostrarNotificacion('Error al cargar modelos', 'error');
        }
        
        return [];
    }

    // ==================== FUNCIONES PARA VEHÍCULOS ====================

    // Función principal para cargar vehículos
    async function cargarVehiculosDesdeBD() {
        console.log('📡 Solicitando datos de vehículos...');
        
        try {
            const response = await fetch('api/get-vehiculos.php', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                credentials: 'same-origin'
            });
            
            console.log('📊 Status:', response.status, response.statusText);
            
            // Leer la respuesta como texto primero para debug
            const responseText = await response.text();
            console.log('📝 Respuesta completa (primeros 500 chars):', responseText.substring(0, 500));
            
            // Verificar si la respuesta contiene HTML (error PHP)
            if (responseText.trim().startsWith('<!DOCTYPE') || 
                responseText.includes('<html') || 
                responseText.includes('<br />') ||
                responseText.includes('Parse error') ||
                responseText.includes('Fatal error')) {
                
                console.error('❌ El servidor devolvió HTML/error PHP en lugar de JSON');
                
                // Intentar extraer mensaje de error del HTML
                let errorMessage = 'Error en el servidor (HTML devuelto)';
                
                // Buscar mensajes comunes de error PHP
                const errorMatch = responseText.match(/<b>(.*?)<\/b>/);
                if (errorMatch && errorMatch[1]) {
                    errorMessage = `Error PHP: ${errorMatch[1]}`;
                } else if (responseText.includes('Parse error')) {
                    errorMessage = 'Error de sintaxis en el servidor';
                } else if (responseText.includes('Fatal error')) {
                    errorMessage = 'Error fatal en el servidor';
                }
                
                throw new Error(errorMessage);
            }
            
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('✅ JSON parseado correctamente');
            } catch (parseError) {
                console.error('❌ Error parseando JSON:', parseError);
                console.error('❌ Texto que falló:', responseText.substring(0, 200));
                throw new Error('La API no devolvió JSON válido. Verifica el servidor.');
            }
            
            // Procesar la respuesta
            if (data.error || data.success === false) {
                const errorMsg = data.message || data.error || 'Error en la API';
                throw new Error(errorMsg);
            }
            
            // Extraer array de vehículos
            let vehiculosArray = [];
            
            if (Array.isArray(data)) {
                vehiculosArray = data;
            } else if (data && data.data && Array.isArray(data.data)) {
                vehiculosArray = data.data;
            } else if (data && data.vehiculos && Array.isArray(data.vehiculos)) {
                vehiculosArray = data.vehiculos;
            } else {
                console.error('❌ Formato de datos no reconocido:', data);
                mostrarError('Formato de datos no reconocido del servidor');
                return;
            }
            
            console.log(`🚗 ${vehiculosArray.length} vehículos recibidos`);
            
            // Guardar vehículos y mostrar
            vehiculosActuales = vehiculosArray;
            mostrarVehiculos(vehiculosArray);
            
        } catch (error) {
            console.error('❌ Error cargando vehículos:', error);
            
            // Mostrar mensaje de error apropiado
            let mensajeError = error.message;
            
            if (error.message.includes('HTML') || error.message.includes('PHP')) {
                mensajeError = 'Error en el servidor. Contacta al administrador.';
            } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                mensajeError = 'Error de conexión. Verifica tu internet.';
            }
            
            mostrarError('Error al cargar vehículos: ' + mensajeError);
            
            // También mostrar notificación
            mostrarNotificacion('No se pudieron cargar los vehículos', 'error');
        }
    }

    // Función para mostrar error en la tabla
    function mostrarError(mensaje) {
        if (!vehiculosTableBody) return;
        
        vehiculosTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="error-data">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div class="error-message">${escapeHTML(mensaje)}</div>
                    <button onclick="recargarVehiculos()" class="btn-reload">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                    <button onclick="mostrarDetallesError()" class="btn-reload" style="margin-left: 10px;">
                        <i class="fas fa-bug"></i> Ver detalles
                    </button>
                </td>
            </tr>
        `;
        
        if (vehiculosCount) {
            vehiculosCount.textContent = '0';
        }
    }

    // Función para mostrar detalles del error
    window.mostrarDetallesError = function() {
        mostrarNotificacion('Revisa la consola del navegador para detalles técnicos (F12 → Consola)', 'info', 5000);
    };

    // Función para mostrar vehículos en la tabla
    function mostrarVehiculos(vehiculos = []) {
        console.log('🎨 Mostrando', vehiculos.length, 'vehículos en la tabla');
        
        if (!vehiculosTableBody) {
            console.error('❌ ERROR: No se encontró el elemento vehiculosTableBody');
            return;
        }
        
        // Limpiar tabla
        vehiculosTableBody.innerHTML = '';
        
        if (vehiculos.length === 0) {
            vehiculosTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="no-data">
                        <i class="fas fa-car-alt"></i>
                        No hay vehículos registrados en la base de datos
                    </td>
                </tr>
            `;
            
            if (vehiculosCount) {
                vehiculosCount.textContent = '0';
            }
            return;
        }
        
        // Crear filas para cada vehículo
        vehiculos.forEach((vehiculo) => {
            const patente = vehiculo.patente || vehiculo.Patente || 'Sin patente';
            const tipo = vehiculo.tipo_vehiculo || vehiculo.tipo || 'No especificado';
            const marca = vehiculo.marca || vehiculo.Marca || 'No especificada';
            const modelo = vehiculo.modelo || vehiculo.Modelo || 'No especificado';
            const anio = vehiculo.anio || vehiculo.anio_fabricacion || 'N/A';
            
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${escapeHTML(patente)}</td>
                <td>${escapeHTML(tipo)}</td>
                <td>${escapeHTML(marca)}</td>
                <td>${escapeHTML(modelo)}</td>
                <td>${escapeHTML(anio)}</td>
            `;
            
            vehiculosTableBody.appendChild(row);
        });
        
        console.log(`✅ Tabla actualizada con ${vehiculos.length} vehículos`);
        
        if (vehiculosCount) {
            vehiculosCount.textContent = vehiculos.length;
        }
    }

    // ==================== FUNCIONES PARA GUARDAR VEHÍCULO ====================

    // Función para manejar el envío del formulario
    async function handleGuardarVehiculo(e) {
        e.preventDefault();
        console.log('📝 Enviando formulario de vehículo...');
        
        if (!vehiculoForm) {
            console.error('❌ Formulario no encontrado');
            return;
        }
        
        // Obtener datos del formulario
        const formData = new FormData(vehiculoForm);
        const nuevoVehiculo = {
            patente: formData.get('patente'),
            tipo_vehiculo_id: formData.get('tipo_vehiculo'),
            modelo_id: formData.get('modelo'),
            anio: formData.get('anio'),
            color: formData.get('color') || null,
            motor: formData.get('motor') || null,
            pais_origen: formData.get('pais_origen') || null
        };
        
        console.log('📝 Datos del nuevo vehículo:', nuevoVehiculo);
        
        // Validación básica
        if (!nuevoVehiculo.patente) {
            mostrarNotificacion('La patente es requerida', 'error');
            return;
        }
        
        // Validar patente
        if (!validarPatente(nuevoVehiculo.patente)) {
            mostrarNotificacion('Patente inválida. Use formato: ABC123 o ABCD123', 'error');
            return;
        }
        
        // Validar año
        const currentYear = new Date().getFullYear();
        if (nuevoVehiculo.anio < 1900 || nuevoVehiculo.anio > currentYear + 1) {
            mostrarNotificacion(`El año debe estar entre 1900 y ${currentYear + 1}`, 'error');
            return;
        }
        
        // Mostrar indicador de carga
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
                body: JSON.stringify(nuevoVehiculo),
                credentials: 'same-origin'
            });
            
            const result = await response.json();
            
            console.log('📊 Respuesta del servidor:', result);
            
            if (result.success) {
                mostrarNotificacion(result.message || 'Vehículo guardado exitosamente', 'success');
                vehiculoForm.reset();
                
                // Recargar lista de vehículos
                await cargarVehiculosDesdeBD();
                
            } else {
                mostrarNotificacion(result.message || 'Error al guardar vehículo', 'error');
            }
            
        } catch (error) {
            console.error('❌ Error al guardar:', error);
            mostrarNotificacion('Error de conexión al servidor', 'error');
        } finally {
            // Restaurar botón
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    // Función para validar patente
    function validarPatente(patente) {
        // Formato chileno antiguo: ABC123 (6 caracteres)
        // Formato chileno nuevo: ABCD123 (7 caracteres)
        return /^[A-Z]{3,4}[0-9]{3}$/.test(patente);
    }

    // ==================== FUNCIONES AUXILIARES ====================

    // Mostrar error en la tabla
    function mostrarError(mensaje) {
        if (!vehiculosTableBody) return;
        
        vehiculosTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="error-data">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div class="error-message">${escapeHTML(mensaje)}</div>
                    <button onclick="recargarVehiculos()" class="btn-reload">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </td>
            </tr>
        `;
        
        if (vehiculosCount) {
            vehiculosCount.textContent = '0';
        }
    }

    // Función global para recargar
    window.recargarVehiculos = function() {
        console.log('🔄 Recargando vehículos...');
        cargarVehiculosDesdeBD();
    };

    // Escapar HTML para prevenir XSS
    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Manejar búsqueda
    function handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            mostrarVehiculos(vehiculosActuales);
            return;
        }
        
        const vehiculosFiltrados = vehiculosActuales.filter(vehiculo => {
            const patente = (vehiculo.patente || vehiculo.Patente || '').toLowerCase();
            const tipo = (vehiculo.tipo_vehiculo || vehiculo.tipo || '').toLowerCase();
            const marca = (vehiculo.marca || vehiculo.Marca || '').toLowerCase();
            const modelo = (vehiculo.modelo || vehiculo.Modelo || '').toLowerCase();
            const anio = (vehiculo.anio || vehiculo.anio_fabricacion || '').toString().toLowerCase();
            
            return patente.includes(searchTerm) ||
                   tipo.includes(searchTerm) ||
                   marca.includes(searchTerm) ||
                   modelo.includes(searchTerm) ||
                   anio.includes(searchTerm);
        });
        
        mostrarVehiculos(vehiculosFiltrados);
        
        if (vehiculosCount) {
            vehiculosCount.textContent = vehiculosFiltrados.length;
        }
    }

    // Limpiar formulario
    function limpiarFormulario() {
        if (vehiculoForm) {
            vehiculoForm.reset();
        }
    }

    // ==================== FUNCIONES PARA NOTIFICACIONES ====================

    // Función para mostrar notificaciones
    function mostrarNotificacion(mensaje, tipo = 'info', duracion = 5000) {
        console.log(`📢 Notificación [${tipo}]: ${mensaje}`);
        
        const notificacion = document.createElement('div');
        notificacion.className = 'notification';
        
        // Configurar estilos
        notificacion.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease-out;
            max-width: 400px;
            word-wrap: break-word;
        `;
        
        // Colores según tipo
        const colores = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        notificacion.style.backgroundColor = colores[tipo] || colores.info;
        
        // Icono según tipo
        const iconos = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        notificacion.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">${iconos[tipo] || 'ℹ️'}</span>
                <span>${mensaje}</span>
            </div>
        `;
        
        // Agregar animación CSS si no existe
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Agregar al DOM
        document.body.appendChild(notificacion);
        
        // Auto-remover después de la duración
        setTimeout(() => {
            notificacion.style.animation = 'slideOut 0.3s ease-out forwards';
            
            setTimeout(() => {
                if (notificacion.parentNode) {
                    notificacion.parentNode.removeChild(notificacion);
                }
            }, 300);
        }, duracion);
        
        // Permitir cerrar haciendo clic
        notificacion.addEventListener('click', () => {
            notificacion.style.animation = 'slideOut 0.3s ease-out forwards';
            
            setTimeout(() => {
                if (notificacion.parentNode) {
                    notificacion.parentNode.removeChild(notificacion);
                }
            }, 300);
        });
        
        return notificacion;
    }

    // ==================== INICIALIZAR APLICACIÓN ====================
    init();
});