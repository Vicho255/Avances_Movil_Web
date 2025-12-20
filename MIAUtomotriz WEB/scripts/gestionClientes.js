// gestionClientes.js - Versión corregida y unificada

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Inicializando Gestión de Clientes');
    
    // Elementos del DOM
    const clientesTableBody = document.getElementById('clientesTableBody');
    const clientCount = document.getElementById('clientCount');
    const searchInput = document.getElementById('searchClientes');
    const btnLimpiar = document.getElementById('btnLimpiar');
    const clienteForm = document.getElementById('clienteForm');

    // Variable para almacenar clientes actuales
    let clientesActuales = [];

    // Inicializar la aplicación
    function init() {
        console.log('🚀 Iniciando aplicación...');
        updateDateTime();
        setInterval(updateDateTime, 1000);
        cargarClientesDesdeBD();
        cargarAseguradoras(); // Cargar aseguradoras al iniciar
        initEventListeners();
        initThemeStyles();
    }

    // Inicializar event listeners (SOLO UNA VEZ)
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
        
        // Formulario de cliente
        if (clienteForm) {
            clienteForm.addEventListener('submit', handleGuardarCliente);
            
            // Agregar formato automático al RUT
            const rutInput = document.getElementById('rut');
            if (rutInput) {
                rutInput.addEventListener('input', function() {
                    formatearRUT(this);
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

    // ==================== FUNCIONES PARA ASEGURADORAS ====================

    // Cargar aseguradoras para el select

    // Función para cargar aseguradoras desde PostgreSQL
async function cargarAseguradoras() {
    console.log('🏢 INICIANDO carga de aseguradoras desde PostgreSQL...');
    
    const select = document.getElementById('aseguradora_id');
    if (!select) {
        console.error('❌ ERROR: Select de aseguradoras no encontrado');
        return;
    }
    
    console.log('✅ Select encontrado');
    
    try {
        // Agregar timestamp para evitar caché
        const timestamp = new Date().getTime();
        const url = `api/get-aseguradora.php?t=${timestamp}`;
        
        console.log('📡 Solicitando:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            },
            credentials: 'same-origin'
        });
        
        console.log('📊 Status:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📝 Respuesta completa:', result);
        
        if (result.success) {
            // Limpiar todas las opciones excepto la primera
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            if (result.count > 0 && Array.isArray(result.data)) {
                // Agregar cada aseguradora al select
                result.data.forEach(aseguradora => {
                    const option = document.createElement('option');
                    option.value = aseguradora.ID || aseguradora.id || '';
                    option.textContent = aseguradora.Nombre_Empresa || 
                                       aseguradora.nombre_empresa || 
                                       'Sin nombre';
                    
                    // Opcional: agregar información de contacto como atributo data
                    if (aseguradora.Nombre_Contacto) {
                        option.setAttribute('data-contacto', aseguradora.Nombre_Contacto);
                    }
                    
                    select.appendChild(option);
                });
                
                console.log(`✅ ${result.data.length} aseguradoras cargadas desde PostgreSQL`);
                mostrarNotificacion(`✅ ${result.data.length} aseguradoras cargadas`, 'success', 3000);
                
            } else {
                console.log('ℹ️ No hay aseguradoras en la base de datos');
                const option = document.createElement('option');
                option.value = '';
                option.textContent = '-- No hay aseguradoras registradas --';
                option.disabled = true;
                option.selected = true;
                select.appendChild(option);
                
                mostrarNotificacion('No hay aseguradoras registradas', 'info', 3000);
            }
            
        } else {
            // Mostrar error del servidor
            const errorMsg = result.message || 'Error desconocido';
            console.error('❌ Error del servidor:', errorMsg);
            
            // Agregar opción de error
            const option = document.createElement('option');
            option.value = '';
            option.textContent = `Error: ${errorMsg}`;
            option.disabled = true;
            option.selected = true;
            select.appendChild(option);
            
            mostrarNotificacion(`Error: ${errorMsg}`, 'error');
        }
        
    } catch (error) {
        console.error('❌ Error cargando aseguradoras:', error);
        
        // Limpiar opciones y mostrar error
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        const option = document.createElement('option');
        option.value = '';
        option.textContent = `Error de conexión: ${error.message}`;
        option.disabled = true;
        option.selected = true;
        select.appendChild(option);
        
        mostrarNotificacion('Error al cargar aseguradoras', 'error');
    }
}

    // Función de fallback con datos de prueba

    // ==================== FUNCIONES PARA CLIENTES ====================

    // Función principal para cargar clientes
    async function cargarClientesDesdeBD() {
        console.log('📡 Solicitando datos de clientes...');
        
        try {
            const response = await fetch('api/get-clientes.php', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                credentials: 'same-origin'
            });
            
            console.log('📊 Status:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const responseText = await response.text();
            console.log('📝 Respuesta completa:', responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('✅ JSON parseado correctamente');
            } catch (parseError) {
                console.error('❌ Error parseando JSON:', parseError);
                throw new Error('La API no devolvió JSON válido');
            }
            
            // Procesar la respuesta
            if (data.error) {
                throw new Error(data.error + ': ' + (data.message || ''));
            }
            
            if (data.success === false) {
                throw new Error(data.message || 'Error en la API');
            }
            
            // Extraer array de clientes según el formato
            let clientesArray = [];
            
            if (Array.isArray(data)) {
                // Formato: Array directo
                clientesArray = data;
            } else if (data && data.data && Array.isArray(data.data)) {
                // Formato: {success: true, data: [...]}
                clientesArray = data.data;
            } else if (data && data.clientes && Array.isArray(data.clientes)) {
                // Formato: {clientes: [...]}
                clientesArray = data.clientes;
            } else if (data && data.result && Array.isArray(data.result)) {
                // Formato: {result: [...]}
                clientesArray = data.result;
            } else {
                // Intentar encontrar cualquier array en el objeto
                const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
                if (arrayKeys.length > 0) {
                    clientesArray = data[arrayKeys[0]];
                    console.log(`Usando array de propiedad: "${arrayKeys[0]}"`);
                } else {
                    console.error('❌ No se encontró array de clientes en la respuesta:', data);
                    mostrarError('Formato de datos no reconocido');
                    return;
                }
            }
            
            console.log(`👥 ${clientesArray.length} clientes recibidos`);
            
            if (clientesArray.length > 0) {
                console.log('🔍 Estructura del primer cliente:', clientesArray[0]);
            }
            
            // Guardar clientes y mostrar
            clientesActuales = clientesArray;
            mostrarClientes(clientesArray);
            
        } catch (error) {
            console.error('❌ Error:', error);
            mostrarError('Error al cargar clientes: ' + error.message);
        }
    }

    // Función para mostrar clientes en la tabla
    function mostrarClientes(clientes = []) {
        console.log('🎨 Mostrando', clientes.length, 'clientes en la tabla');
        
        if (!clientesTableBody) {
            console.error('❌ ERROR: No se encontró el elemento clientesTableBody');
            return;
        }
        
        // Limpiar tabla
        clientesTableBody.innerHTML = '';
        
        if (clientes.length === 0) {
            clientesTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">
                        <i class="fas fa-users-slash"></i>
                        No hay clientes registrados en la base de datos
                    </td>
                </tr>
            `;
            
            if (clientCount) {
                clientCount.textContent = '0';
            }
            return;
        }
        
        // Crear filas para cada cliente
        clientes.forEach((cliente, index) => {
            // Obtener valores según la estructura EXACTA de la tabla Persona
            const rut = cliente.RUT || cliente.rut || 'Sin RUT';
            const nombre = cliente.Nombre || cliente.nombre || '';
            const apellido = cliente.Apellido || cliente.apellido || '';
            const email = cliente.email || cliente.Email || cliente.correo || 'No registrado';
            const telefono = cliente.telefono || cliente.Telefono || cliente.phone || 'No registrado';
            const fechaRegistro = cliente.Fecha_Registro || cliente.fecha_registro || '';
            
            // Formatear fecha
            const fechaFormateada = fechaRegistro ? formatDate(fechaRegistro) : 'No registrada';
            
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${escapeHTML(rut)}</td>
                <td>${escapeHTML(nombre)}</td>
                <td>${escapeHTML(apellido)}</td>
                <td>${escapeHTML(email)}</td>
                <td>${escapeHTML(telefono)}</td>
                <td>${fechaFormateada}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="verDetallesCliente('${escapeHTML(rut)}')"
                                title="Ver detalles" aria-label="Ver detalles de ${escapeHTML(nombre)}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-edit" onclick="editarClienteDesdeBD('${escapeHTML(rut)}')" 
                                title="Editar" aria-label="Editar cliente ${escapeHTML(nombre)}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="eliminarClienteDesdeBD('${escapeHTML(rut)}')"
                                title="Eliminar" aria-label="Eliminar cliente ${escapeHTML(nombre)}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            clientesTableBody.appendChild(row);
        });
        
        console.log(`✅ Tabla actualizada con ${clientes.length} clientes`);
        
        if (clientCount) {
            clientCount.textContent = clientes.length;
        }
    }

    // ==================== FUNCIONES PARA GUARDAR CLIENTE ====================

    // Función para manejar el envío del formulario
    async function handleGuardarCliente(e) {
        e.preventDefault();
        console.log('📝 Enviando formulario...');
        
        if (!clienteForm) {
            console.error('❌ Formulario no encontrado');
            return;
        }
        
        // Obtener datos del formulario
        const formData = new FormData(clienteForm);
        const nuevoCliente = {
            rut: formData.get('rut'),
            nombre: formData.get('nombre'),
            apellido: formData.get('apellido'),
            email: formData.get('email'),
            telefono: formData.get('telefono'),
            fecha_nac: formData.get('fecha_nac'),
            direccion_cp: formData.get('direccion_cp'),
            aseguradora_id: formData.get('aseguradora_id') || 'Sin Aseguradora'
        };
        
        console.log('📝 Datos del nuevo cliente:', nuevoCliente);
        
        // Validación básica
        if (!nuevoCliente.rut || !nuevoCliente.nombre || !nuevoCliente.apellido) {
            mostrarNotificacion('RUT, Nombre y Apellido son requeridos', 'error');
            return;
        }
        
        // Validar formato RUT
        if (!validarFormatoRUT(nuevoCliente.rut)) {
            mostrarNotificacion('Formato de RUT inválido. Use: 12345678-9', 'error');
            return;
        }
        
        // Mostrar indicador de carga
        const submitBtn = clienteForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('api/guardar-cliente.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(nuevoCliente),
                credentials: 'same-origin'
            });
            
            const result = await response.json();
            
            console.log('📊 Respuesta del servidor:', result);
            
            if (result.success) {
                mostrarNotificacion(result.message, 'success');
                clienteForm.reset();
                
                // Recargar lista de clientes
                await cargarClientesDesdeBD();
                
                // Opcional: Mostrar el nuevo cliente al principio
                if (result.cliente) {
                    console.log('✅ Cliente creado:', result.cliente);
                }
            } else {
                mostrarNotificacion(result.message || 'Error al guardar cliente', 'error');
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

    // Función para validar formato RUT
    function validarFormatoRUT(rut) {
        return /^[0-9]{7,8}-[0-9Kk]$/.test(rut);
    }

    // Función para formatear RUT automáticamente
    function formatearRUT(input) {
        let value = input.value.replace(/[^\dkK]/g, '');
        
        if (value.length > 0) {
            // Separar número y dígito verificador
            const numero = value.slice(0, -1);
            const dv = value.slice(-1).toUpperCase();
            
            if (numero.length <= 8) {
                input.value = numero + (dv ? '-' + dv : '');
            }
        }
    }

    // ==================== FUNCIONES AUXILIARES ====================

    // Mostrar error en la tabla
    function mostrarError(mensaje) {
        if (!clientesTableBody) return;
        
        clientesTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="error-data">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div class="error-message">${escapeHTML(mensaje)}</div>
                    <button onclick="recargarClientes()" class="btn-reload">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </td>
            </tr>
        `;
        
        if (clientCount) {
            clientCount.textContent = '0';
        }
    }

    // Función global para recargar
    window.recargarClientes = function() {
        console.log('🔄 Recargando clientes...');
        cargarClientesDesdeBD();
    };

    // Escapar HTML para prevenir XSS
    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Formatear fecha
    function formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    }

    // Manejar búsqueda
    function handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            mostrarClientes(clientesActuales);
            return;
        }
        
        const clientesFiltrados = clientesActuales.filter(cliente => {
            const rut = (cliente.RUT || cliente.rut || '').toLowerCase();
            const nombre = (cliente.Nombre || cliente.nombre || '').toLowerCase();
            const apellido = (cliente.Apellido || cliente.apellido || '').toLowerCase();
            const email = (cliente.email || cliente.Email || '').toLowerCase();
            const telefono = (cliente.telefono || cliente.Telefono || '').toLowerCase();
            
            return rut.includes(searchTerm) ||
                   nombre.includes(searchTerm) ||
                   apellido.includes(searchTerm) ||
                   email.includes(searchTerm) ||
                   telefono.includes(searchTerm);
        });
        
        mostrarClientes(clientesFiltrados);
        
        if (clientCount) {
            clientCount.textContent = clientesFiltrados.length;
        }
    }

    // Limpiar formulario
    function limpiarFormulario() {
        if (clienteForm) {
            clienteForm.reset();
        }
    }

    // ==================== FUNCIONES PARA BOTONES DE ACCIÓN ====================

    // Función corregida para eliminar cliente
window.eliminarClienteDesdeBD = async function(rut) {
    console.log('🗑️ Intentando eliminar cliente:', rut);
    
    if (!rut || rut.trim() === '') {
        mostrarNotificacion('RUT no válido', 'error');
        return;
    }
    
    // Obtener nombre del cliente
    const cliente = clientesActuales.find(c => c.RUT === rut);
    const nombreCliente = cliente ? `${cliente.Nombre} ${cliente.Apellido}` : 'este cliente';
    
    const confirmacion = await mostrarConfirmacion(
        `¿Eliminar cliente?`,
        `¿Está seguro de eliminar a <strong>${nombreCliente}</strong> (RUT: ${rut})?<br><br>
         Esta acción no se puede deshacer.`,
        'warning'
    );
    
    if (!confirmacion) {
        mostrarNotificacion('Eliminación cancelada', 'info', 3000);
        return;
    }
    
    // Crear una copia del RUT para evitar problemas de referencia
    const rutAEliminar = rut;
    
    try {
        // Mostrar indicador de carga
        const loadingNotification = mostrarNotificacion('Eliminando cliente...', 'info');
        
        console.log('📤 Enviando solicitud para eliminar:', rutAEliminar);
        
        // Hacer la solicitud
        const response = await fetch('api/eliminar-cliente.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ rut: rutAEliminar })
        });
        
        console.log('📊 Respuesta recibida, status:', response.status);
        
        // SOLUCIÓN: Leer la respuesta UNA SOLA VEZ como texto
        const responseText = await response.text();
        console.log('📝 Texto de respuesta:', responseText.substring(0, 200) + '...');
        
        // Remover notificación de carga
        if (loadingNotification && loadingNotification.parentNode) {
            loadingNotification.parentNode.removeChild(loadingNotification);
        }
        
        let result;
        try {
            // Intentar parsear como JSON
            result = JSON.parse(responseText);
            console.log('✅ JSON parseado correctamente:', result);
        } catch (jsonError) {
            console.error('❌ Error parseando JSON:', jsonError);
            
            // Verificar si es HTML/error PHP
            if (responseText.includes('<') || responseText.toLowerCase().includes('error')) {
                console.error('⚠️ El servidor devolvió HTML/errores PHP');
                
                // Extraer mensaje de error si es posible
                let errorMessage = 'Error del servidor';
                
                // Intentar extraer mensaje de error común
                if (responseText.includes('SQLSTATE') || responseText.includes('ERROR:')) {
                    const match = responseText.match(/SQLSTATE\[.*?\]:?.*?(ERROR:.*?)(?=<br|\n|$)/i);
                    if (match && match[1]) {
                        errorMessage = match[1].trim();
                    }
                } else if (responseText.includes('Parse error') || responseText.includes('Fatal error')) {
                    errorMessage = 'Error de sintaxis en el servidor';
                }
                
                throw new Error(errorMessage);
            } else {
                throw new Error('El servidor devolvió una respuesta no válida');
            }
        }
        
        // Procesar resultado
        if (result.success) {
            mostrarNotificacion(
                result.message || `Cliente ${nombreCliente} eliminado exitosamente`, 
                'success'
            );
            
            // Recargar lista de clientes
            await cargarClientesDesdeBD();
            
        } else {
            // Manejar errores específicos
            if (result.tiene_servicios) {
                mostrarNotificacion(
                    `No se puede eliminar. El cliente tiene ${result.num_servicios} servicio(s) registrado(s).`,
                    'error',
                    6000
                );
            } else if (result.error_type === 'foreign_key') {
                mostrarNotificacion(
                    'No se puede eliminar porque el cliente tiene registros relacionados.',
                    'error',
                    6000
                );
            } else {
                mostrarNotificacion(
                    result.message || 'Error al eliminar el cliente',
                    'error'
                );
            }
        }
        
    } catch (error) {
        console.error('❌ Error en el proceso de eliminación:', error);
        
        // Mostrar notificación de error
        let mensajeError = error.message || 'Error desconocido';
        
        // Simplificar mensajes comunes
        if (mensajeError.includes('Failed to fetch') || mensajeError.includes('NetworkError')) {
            mensajeError = 'Error de conexión: No se pudo contactar al servidor';
        } else if (mensajeError.includes('Unexpected token') || mensajeError.includes('JSON')) {
            mensajeError = 'Error: El servidor devolvió una respuesta no válida';
        } else if (mensajeError.includes('body stream already read')) {
            mensajeError = 'Error interno: Problema al procesar la respuesta';
        }
        
        mostrarNotificacion(mensajeError, 'error', 5000);
    }
};  
// ==================== FUNCIÓN PARA MOSTRAR NOTIFICACIONES ====================

function mostrarNotificacion(mensaje, tipo = 'info', duracion = 5000) {
    // Verificar si ya existe una función similar
    console.log(`📢 Notificación [${tipo}]: ${mensaje}`);
    
    // Crear elemento de notificación
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

// ==================== FUNCIÓN PARA MOSTRAR CONFIRMACIÓN ====================

function mostrarConfirmacion(titulo, mensaje, tipo = 'warning') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.id = 'modal-confirmacion';
        
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        let color = '#f59e0b'; // warning por defecto
        if (tipo === 'danger' || tipo === 'error') color = '#ef4444';
        if (tipo === 'success') color = '#10b981';
        if (tipo === 'info') color = '#3b82f6';
        
        modal.innerHTML = `
            <div style="
                background: white; 
                padding: 30px; 
                border-radius: 10px; 
                max-width: 500px; 
                width: 90%;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            ">
                <h3 style="margin-top: 0; color: ${color};">
                    ${tipo === 'warning' ? '⚠️' : 
                      tipo === 'error' ? '❌' : 
                      tipo === 'success' ? '✅' : 'ℹ️'} 
                    ${titulo}
                </h3>
                <p style="line-height: 1.5; color: #4b5563;">${mensaje}</p>
                <div style="margin-top: 25px; text-align: right;">
                    <button id="btnCancelar" style="
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        margin-right: 10px;
                        font-size: 14px;
                        transition: background 0.2s;
                    ">
                        Cancelar
                    </button>
                    <button id="btnConfirmar" style="
                        background: ${color};
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                        transition: background 0.2s;
                    ">
                        Confirmar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Agregar estilos para hover
        const btnConfirmar = document.getElementById('btnConfirmar');
        const btnCancelar = document.getElementById('btnCancelar');
        
        btnConfirmar.onmouseover = () => btnConfirmar.style.opacity = '0.9';
        btnConfirmar.onmouseout = () => btnConfirmar.style.opacity = '1';
        
        btnCancelar.onmouseover = () => btnCancelar.style.opacity = '0.9';
        btnCancelar.onmouseout = () => btnCancelar.style.opacity = '1';
        
        // Event listeners
        btnConfirmar.onclick = () => {
            modal.remove();
            resolve(true);
        };
        
        btnCancelar.onclick = () => {
            modal.remove();
            resolve(false);
        };
        
        // Cerrar al hacer clic fuera del modal
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve(false);
            }
        };
    });
}

    // ==================== INICIALIZACIÓN ====================
    init();
});