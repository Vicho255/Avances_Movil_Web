// agenda-empleado.js - Versión actualizada con API
document.addEventListener('DOMContentLoaded', function() {
    console.log('📅 Agenda Empleado - Inicializando...');
    
    // Variables globales
    let agendaData = {
        ordenesDisponibles: [],
        calendario: [],
        fechaInicio: null,
        fechaFin: null
    };
    
    let ordenSeleccionada = null;
    
    // Elementos DOM
    let agendaContainer = null;
    
    // Inicializar
    initAgenda();
    
    async function initAgenda() {
        try {
            // 1. Crear estructura base
            crearEstructuraBase();
            
            // 2. Cargar datos iniciales
            await cargarDatosIniciales();
            
            // 3. Renderizar interfaz
            renderizarInterfaz();
            
            // 4. Inicializar funcionalidades
            initFuncionalidades();
            
            // 5. Actualizar hora
            updateTime();
            setInterval(updateTime, 1000);
            
            console.log('✅ Agenda inicializada correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando agenda:', error);
            mostrarErrorAgenda('Error al cargar la agenda');
        }
    }
    
    // ==================== ESTRUCTURA BASE ====================
    function crearEstructuraBase() {
        const mainContainer = document.getElementById('agenda-container');
        if (!mainContainer) return;
        
        agendaContainer = mainContainer;
        
        agendaContainer.innerHTML = `
            <div class="agenda-container">
                <!-- Header con controles -->
                <div class="agenda-header">
                    <div class="header-left">
                        <h2><i class="fas fa-calendar-alt"></i> Mi Agenda</h2>
                        <p>Gestiona tus órdenes y agenda semanal</p>
                    </div>
                    <div class="header-right">
                        <button class="btn-refresh" onclick="recargarAgenda()">
                            <i class="fas fa-redo"></i> Actualizar
                        </button>
                        <button class="btn-nueva" onclick="mostrarModalAsignar()">
                            <i class="fas fa-plus"></i> Nueva Asignación
                        </button>
                    </div>
                </div>
                
                <!-- Contenido principal -->
                <div class="agenda-main">
                    <!-- Panel izquierdo: Órdenes disponibles -->
                    <div class="panel-izquierdo">
                        <div class="panel-card">
                            <div class="panel-header">
                                <h3>
                                    <i class="fas fa-clipboard-list"></i>
                                    Órdenes Disponibles
                                    <span class="badge" id="badge-disponibles">0</span>
                                </h3>
                            </div>
                            <div class="panel-body" id="ordenes-disponibles-container">
                                <div class="loading">
                                    <div class="loading-spinner"></div>
                                    <p>Cargando órdenes...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Panel central: Calendario semanal -->
                    <div class="panel-central">
                        <div class="panel-card">
                            <div class="panel-header">
                                <h3>
                                    <i class="fas fa-calendar-week"></i>
                                    Agenda Semanal
                                </h3>
                                <div class="week-controls">
                                    <button class="btn-week prev" onclick="cambiarSemana(-1)">
                                        <i class="fas fa-chevron-left"></i>
                                    </button>
                                    <div class="current-week" id="current-week">
                                        Cargando...
                                    </div>
                                    <button class="btn-week next" onclick="cambiarSemana(1)">
                                        <i class="fas fa-chevron-right"></i>
                                    </button>
                                    <button class="btn-today" onclick="irAHoy()">
                                        <i class="fas fa-calendar-day"></i> Hoy
                                    </button>
                                </div>
                            </div>
                            <div class="panel-body">
                                <div class="week-calendar" id="week-calendar">
                                    <!-- Calendario se cargará aquí -->
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Panel derecho: Información rápida -->
                    <div class="panel-derecho">
                        <div class="panel-card">
                            <div class="panel-header">
                                <h3><i class="fas fa-info-circle"></i> Información</h3>
                            </div>
                            <div class="panel-body">
                                <div class="info-section">
                                    <h4><i class="fas fa-user"></i> Empleado</h4>
                                    <p id="info-empleado">Cargando...</p>
                                </div>
                                <div class="info-section">
                                    <h4><i class="fas fa-calendar"></i> Esta Semana</h4>
                                    <p id="info-semana">Cargando...</p>
                                </div>
                                <div class="info-section">
                                    <h4><i class="fas fa-tasks"></i> Estadísticas</h4>
                                    <div class="stats-mini">
                                        <div class="stat-mini">
                                            <span class="stat-value" id="stat-asignadas">0</span>
                                            <span class="stat-label">Asignadas</span>
                                        </div>
                                        <div class="stat-mini">
                                            <span class="stat-value" id="stat-completadas">0</span>
                                            <span class="stat-label">Completadas</span>
                                        </div>
                                        <div class="stat-mini">
                                            <span class="stat-value" id="stat-pendientes">0</span>
                                            <span class="stat-label">Pendientes</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Modales -->
            <div class="modal" id="modal-detalles" style="display: none;"></div>
            <div class="modal" id="modal-asignar" style="display: none;"></div>
        `;
    }
    
    // ==================== CARGAR DATOS ====================
    async function cargarDatosIniciales() {
        try {
            console.log('📡 Cargando datos de agenda...');
            
            // Calcular fechas de la semana actual
            const hoy = new Date();
            const inicioSemana = new Date(hoy);
            inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1); // Lunes
            
            agendaData.fechaInicio = inicioSemana.toISOString().split('T')[0];
            agendaData.fechaFin = new Date(inicioSemana);
            agendaData.fechaFin.setDate(inicioSemana.getDate() + 6);
            agendaData.fechaFin = agendaData.fechaFin.toISOString().split('T')[0];
            
            // Cargar órdenes disponibles
            await cargarOrdenesDisponibles();
            
            // Cargar calendario de la semana
            await cargarCalendarioSemana();
            
            console.log('✅ Datos de agenda cargados');
            
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            throw error;
        }
    }
    
    async function cargarOrdenesDisponibles() {
        try {
            const response = await fetch('api/agenda-data.php?accion=get_ordenes_disponibles');
            const data = await response.json();
            
            if (data.success) {
                agendaData.ordenesDisponibles = data.ordenes_disponibles || [];
                console.log(`✅ ${agendaData.ordenesDisponibles.length} órdenes disponibles`);
            } else {
                throw new Error(data.error || 'Error al cargar órdenes');
            }
        } catch (error) {
            console.error('❌ Error cargando órdenes disponibles:', error);
            agendaData.ordenesDisponibles = [];
        }
    }
    
    async function cargarCalendarioSemana() {
        try {
            const params = new URLSearchParams({
                accion: 'get_semana',
                fecha_inicio: agendaData.fechaInicio,
                fecha_fin: agendaData.fechaFin
            });
            
            const response = await fetch(`api/agenda-data.php?${params}`);
            const data = await response.json();
            
            if (data.success) {
                agendaData.calendario = data.calendario || [];
                console.log(`✅ Calendario cargado (${agendaData.calendario.length} días)`);
            } else {
                throw new Error(data.error || 'Error al cargar calendario');
            }
        } catch (error) {
            console.error('❌ Error cargando calendario:', error);
            agendaData.calendario = [];
        }
    }
    
    // ==================== RENDERIZAR INTERFAZ ====================
    function renderizarInterfaz() {
        if (!agendaContainer) return;
        
        // Actualizar badge de órdenes disponibles
        const badge = document.getElementById('badge-disponibles');
        if (badge) {
            badge.textContent = agendaData.ordenesDisponibles.length;
        }
        
        // Renderizar órdenes disponibles
        renderizarOrdenesDisponibles();
        
        // Renderizar calendario
        renderizarCalendario();
        
        // Actualizar información
        actualizarInformacion();
        
        // Actualizar estadísticas
        actualizarEstadisticas();
    }
    
    function renderizarOrdenesDisponibles() {
        const container = document.getElementById('ordenes-disponibles-container');
        if (!container) return;
        
        if (agendaData.ordenesDisponibles.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-check"></i>
                    <h4>¡No hay órdenes disponibles!</h4>
                    <p>Todas las órdenes han sido asignadas.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="ordenes-lista">
                ${agendaData.ordenesDisponibles.map(orden => `
                    <div class="orden-item" data-orden="${orden.numero}">
                        <div class="orden-header">
                            <span class="orden-numero">Orden #${orden.numero}</span>
                            <span class="orden-estado status-${orden.estado ? orden.estado.toLowerCase() : 'pendiente'}">
                                ${orden.estado || 'Pendiente'}
                            </span>
                        </div>
                        <div class="orden-info">
                            <div class="orden-vehiculo">
                                <i class="fas fa-car"></i>
                                ${orden.vehiculo_id || 'Sin patente'} - ${orden.marca || ''} ${orden.modelo || ''}
                            </div>
                            <div class="orden-cliente">
                                <i class="fas fa-user"></i>
                                ${orden.cliente_nombre || 'Cliente no especificado'}
                            </div>
                            ${orden.descripcion ? `
                                <div class="orden-descripcion">
                                    <i class="fas fa-file-alt"></i>
                                    ${escapeHTML(orden.descripcion.substring(0, 100))}${orden.descripcion.length > 100 ? '...' : ''}
                                </div>
                            ` : ''}
                        </div>
                        <div class="orden-acciones">
                            <button class="btn-asignar" onclick="asignarOrden(${orden.numero})">
                                <i class="fas fa-calendar-plus"></i> Asignar
                            </button>
                            <button class="btn-detalles" onclick="verDetallesOrden(${orden.numero})">
                                <i class="fas fa-eye"></i> Ver
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    function renderizarCalendario() {
        const container = document.getElementById('week-calendar');
        if (!container) return;
        
        // Crear encabezado de días
        let html = `
            <div class="week-days">
                ${agendaData.calendario.map(dia => `
                    <div class="week-day ${esHoy(dia.fecha) ? 'today' : ''}">
                        <div class="day-name">${dia.dia_nombre}</div>
                        <div class="day-number ${esHoy(dia.fecha) ? 'today' : ''}">${dia.numero_dia}</div>
                    </div>
                `).join('')}
            </div>
            <div class="week-content">
        `;
        
        // Crear contenido de cada día
        agendaData.calendario.forEach(dia => {
            html += `
                <div class="day-column ${esHoy(dia.fecha) ? 'today' : ''}">
                    <div class="day-orders">
                        ${dia.ordenes.length > 0 ? 
                            dia.ordenes.map(orden => crearEventoCalendario(orden, dia.fecha)).join('') :
                            `<div class="empty-day">
                                <i class="far fa-calendar-times"></i>
                                <small>Sin órdenes</small>
                            </div>`
                        }
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // Actualizar texto de semana actual
        const currentWeek = document.getElementById('current-week');
        if (currentWeek && agendaData.calendario.length > 0) {
            const primerDia = agendaData.calendario[0];
            const ultimoDia = agendaData.calendario[agendaData.calendario.length - 1];
            
            currentWeek.textContent = `
                ${formatFecha(primerDia.fecha)} - ${formatFecha(ultimoDia.fecha)}
            `;
        }
    }
    
    function crearEventoCalendario(orden, fecha) {
        const horaInicio = orden.hora_inicio ? formatTime(orden.hora_inicio) : 'Sin hora';
        
        return `
            <div class="calendario-evento" 
                 onclick="verDetallesOrden(${orden.numero})"
                 title="${orden.descripcion || 'Sin descripción'}">
                <div class="evento-header">
                    <span class="evento-numero">#${orden.numero}</span>
                    <span class="evento-estado status-${orden.estado ? orden.estado.toLowerCase() : 'pendiente'}"></span>
                </div>
                <div class="evento-info">
                    <div class="evento-vehiculo">
                        <i class="fas fa-car"></i>
                        ${orden.vehiculo_id || 'Sin patente'}
                    </div>
                    <div class="evento-hora">
                        <i class="far fa-clock"></i>
                        ${horaInicio}
                    </div>
                </div>
            </div>
        `;
    }
    
    function actualizarInformacion() {
        // Actualizar información del empleado
        const infoEmpleado = document.getElementById('info-empleado');
        if (infoEmpleado) {
            infoEmpleado.textContent = 'Cargando...'; // Se puede obtener de la sesión
        }
        
        // Actualizar información de la semana
        const infoSemana = document.getElementById('info-semana');
        if (infoSemana && agendaData.calendario.length > 0) {
            const hoy = new Date().toISOString().split('T')[0];
            const ordenesHoy = agendaData.calendario.find(dia => dia.fecha === hoy);
            const totalOrdenes = agendaData.calendario.reduce((total, dia) => total + dia.ordenes.length, 0);
            
            infoSemana.innerHTML = `
                <strong>${totalOrdenes} órdenes</strong> programadas<br>
                ${ordenesHoy ? ordenesHoy.ordenes.length : 0} para hoy
            `;
        }
    }
    
    function actualizarEstadisticas() {
        // Calcular estadísticas
        const totalAsignadas = agendaData.calendario.reduce((total, dia) => total + dia.ordenes.length, 0);
        const completadas = agendaData.calendario.reduce((total, dia) => {
            return total + dia.ordenes.filter(o => o.estado === 'Completada').length;
        }, 0);
        const pendientes = totalAsignadas - completadas;
        
        // Actualizar UI
        const statAsignadas = document.getElementById('stat-asignadas');
        const statCompletadas = document.getElementById('stat-completadas');
        const statPendientes = document.getElementById('stat-pendientes');
        
        if (statAsignadas) statAsignadas.textContent = totalAsignadas;
        if (statCompletadas) statCompletadas.textContent = completadas;
        if (statPendientes) statPendientes.textContent = pendientes;
    }
    
    // ==================== FUNCIONALIDADES ====================
    function initFuncionalidades() {
        // Inicializar tema oscuro si existe
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', function() {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('miAutomotriz-tema-empleado', newTheme);
            });
        }
        
        // Toggle sidebar móvil
        const menuToggle = document.querySelector('.menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }
    }
    
    function updateTime() {
        const now = new Date();
        const timeElement = document.getElementById('currentDateTime');
        
        if (timeElement) {
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            };
            timeElement.textContent = now.toLocaleDateString('es-ES', options);
        }
    }
    
    // ==================== FUNCIONES GLOBALES ====================
    window.recargarAgenda = async function() {
        try {
            mostrarLoading();
            await cargarDatosIniciales();
            renderizarInterfaz();
            showNotification('Agenda actualizada', 'success');
        } catch (error) {
            console.error('❌ Error recargando agenda:', error);
            showNotification('Error al actualizar agenda', 'error');
        } finally {
            ocultarLoading();
        }
    };
    
    window.cambiarSemana = async function(semanas) {
        try {
            const fechaInicio = new Date(agendaData.fechaInicio);
            fechaInicio.setDate(fechaInicio.getDate() + (semanas * 7));
            
            agendaData.fechaInicio = fechaInicio.toISOString().split('T')[0];
            agendaData.fechaFin = new Date(fechaInicio);
            agendaData.fechaFin.setDate(fechaInicio.getDate() + 6);
            agendaData.fechaFin = agendaData.fechaFin.toISOString().split('T')[0];
            
            await cargarCalendarioSemana();
            renderizarCalendario();
            actualizarInformacion();
            actualizarEstadisticas();
            
        } catch (error) {
            console.error('❌ Error cambiando semana:', error);
            showNotification('Error al cambiar de semana', 'error');
        }
    };
    
    window.irAHoy = async function() {
        try {
            const hoy = new Date();
            const inicioSemana = new Date(hoy);
            inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1);
            
            agendaData.fechaInicio = inicioSemana.toISOString().split('T')[0];
            agendaData.fechaFin = new Date(inicioSemana);
            agendaData.fechaFin.setDate(inicioSemana.getDate() + 6);
            agendaData.fechaFin = agendaData.fechaFin.toISOString().split('T')[0];
            
            await cargarCalendarioSemana();
            renderizarCalendario();
            actualizarInformacion();
            actualizarEstadisticas();
            
            showNotification('Navegando a la semana actual', 'info');
            
        } catch (error) {
            console.error('❌ Error yendo a hoy:', error);
            showNotification('Error al navegar a hoy', 'error');
        }
    };
    
    window.asignarOrden = async function(numeroOrden) {
        try {
            // Buscar la orden
            const orden = agendaData.ordenesDisponibles.find(o => o.numero == numeroOrden);
            
            if (!orden) {
                showNotification('Orden no disponible', 'error');
                return;
            }
            
            // Mostrar modal para seleccionar fecha y hora
            const hoy = new Date().toISOString().split('T')[0];
            const horaActual = `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`;
            
            const fechaAgenda = prompt('Fecha para la orden (YYYY-MM-DD):', hoy);
            if (!fechaAgenda) return;
            
            const horaInicio = prompt('Hora de inicio (HH:MM):', horaActual);
            if (!horaInicio) return;
            
            // Validaciones
            if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaAgenda)) {
                showNotification('Formato de fecha inválido. Use YYYY-MM-DD', 'error');
                return;
            }
            
            if (!/^\d{2}:\d{2}$/.test(horaInicio)) {
                showNotification('Formato de hora inválido. Use HH:MM', 'error');
                return;
            }
            
            showNotification('Asignando orden...', 'info');
            
            // Enviar al servidor
            const response = await fetch('api/agenda-data.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    accion: 'asignar_orden',
                    orden_numero: numeroOrden,
                    fecha_agenda: fechaAgenda,
                    hora_inicio: horaInicio + ':00',
                    hora_fin: null,
                    observaciones: 'Asignada desde agenda'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('¡Orden asignada exitosamente!', 'success');
                await recargarAgenda();
            } else {
                showNotification(data.message || 'Error al asignar orden', 'error');
            }
            
        } catch (error) {
            console.error('❌ Error asignando orden:', error);
            showNotification('Error de conexión al servidor', 'error');
        }
    };
    
    window.verDetallesOrden = async function(numeroOrden) {
        try {
            showNotification('Cargando detalles...', 'info');
            
            const response = await fetch(`api/agenda-data.php?accion=get_detalles_orden&orden_numero=${numeroOrden}`);
            const data = await response.json();
            
            if (data.success) {
                mostrarModalDetalles(data.orden, data.repuestos);
            } else {
                showNotification(data.message || 'Error al cargar detalles', 'error');
            }
            
        } catch (error) {
            console.error('❌ Error cargando detalles:', error);
            showNotification('Error al cargar detalles de la orden', 'error');
        }
    };
    
    window.mostrarModalAsignar = function() {
        // Implementar modal para asignar nueva orden
        showNotification('Funcionalidad en desarrollo', 'info');
    };
    
    // ==================== FUNCIONES AUXILIARES ====================
    function esHoy(fechaStr) {
        const hoy = new Date().toISOString().split('T')[0];
        return fechaStr === hoy;
    }
    
    function formatFecha(fechaStr) {
        if (!fechaStr) return '';
        try {
            const fecha = new Date(fechaStr);
            return fecha.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short'
            });
        } catch (e) {
            return fechaStr;
        }
    }
    
    function formatTime(timeStr) {
        if (!timeStr) return '';
        try {
            const time = new Date(`2000-01-01T${timeStr}`);
            return time.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } catch (e) {
            return timeStr.substr(0, 5);
        }
    }
    
    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    function mostrarLoading() {
        // Implementar spinner de carga
        console.log('⏳ Cargando...');
    }
    
    function ocultarLoading() {
        console.log('✅ Carga completada');
    }
    
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 400px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    function getNotificationIcon(type) {
        return {
            'success': 'check-circle',
            'warning': 'exclamation-triangle',
            'error': 'times-circle',
            'info': 'info-circle'
        }[type] || 'info-circle';
    }
    
    function getNotificationColor(type) {
        return {
            'success': '#10b981',
            'warning': '#f59e0b',
            'error': '#ef4444',
            'info': '#3b82f6'
        }[type] || '#3b82f6';
    }
    
    function mostrarModalDetalles(orden, repuestos) {
        const modalHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>
                        <i class="fas fa-clipboard-list"></i>
                        Orden #${orden.numero}
                        <span class="modal-status status-${orden.estado ? orden.estado.toLowerCase() : 'pendiente'}">
                            ${orden.estado || 'Pendiente'}
                        </span>
                    </h3>
                    <button class="close-modal" onclick="cerrarModalDetalles()">&times;</button>
                </div>
                <div class="modal-body">
                    <!-- Contenido del modal -->
                    <div class="orden-detalles">
                        <div class="detalle-section">
                            <h4><i class="fas fa-info-circle"></i> Información General</h4>
                            <div class="detalle-grid">
                                <div class="detalle-item">
                                    <span class="detalle-label">Vehículo</span>
                                    <span class="detalle-value">
                                        ${orden.vehiculo_id || 'Sin patente'} - 
                                        ${orden.marca || ''} ${orden.modelo || ''}
                                    </span>
                                </div>
                                <div class="detalle-item">
                                    <span class="detalle-label">Cliente</span>
                                    <span class="detalle-value">${orden.cliente_nombre || 'No especificado'}</span>
                                </div>
                                ${orden.cliente_telefono ? `
                                    <div class="detalle-item">
                                        <span class="detalle-label">Teléfono</span>
                                        <span class="detalle-value">${orden.cliente_telefono}</span>
                                    </div>
                                ` : ''}
                                ${orden.fecha_agenda ? `
                                    <div class="detalle-item">
                                        <span class="detalle-label">Fecha Agenda</span>
                                        <span class="detalle-value">${formatFecha(orden.fecha_agenda)}</span>
                                    </div>
                                ` : ''}
                                ${orden.hora_inicio ? `
                                    <div class="detalle-item">
                                        <span class="detalle-label">Hora Inicio</span>
                                        <span class="detalle-value">${formatTime(orden.hora_inicio)}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        ${orden.descripcion ? `
                            <div class="detalle-section">
                                <h4><i class="fas fa-file-alt"></i> Descripción</h4>
                                <p>${escapeHTML(orden.descripcion)}</p>
                            </div>
                        ` : ''}
                        
                        ${orden.averias ? `
                            <div class="detalle-section">
                                <h4><i class="fas fa-tools"></i> Averías</h4>
                                <p>${orden.averias}</p>
                            </div>
                        ` : ''}
                        
                        ${repuestos && repuestos.length > 0 ? `
                            <div class="detalle-section">
                                <h4><i class="fas fa-cogs"></i> Repuestos</h4>
                                <ul>
                                    ${repuestos.map(repuesto => `
                                        <li>${repuesto.nombre} (${repuesto.cantidad_instalada || 1} unidad/es)</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="actualizarAgendaOrden(${orden.numero})">
                        <i class="fas fa-edit"></i> Editar Agenda
                    </button>
                    <button class="btn btn-secondary" onclick="cerrarModalDetalles()">
                        <i class="fas fa-times"></i> Cerrar
                    </button>
                </div>
            </div>
        `;
        
        const modal = document.getElementById('modal-detalles');
        modal.innerHTML = modalHTML;
        modal.style.display = 'block';
        
        // Agregar event listener para cerrar
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Cerrar al hacer clic fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    window.cerrarModalDetalles = function() {
        const modal = document.getElementById('modal-detalles');
        if (modal) {
            modal.style.display = 'none';
        }
    };
    
    window.actualizarAgendaOrden = async function(numeroOrden) {
        try {
            const nuevaFecha = prompt('Nueva fecha (YYYY-MM-DD):');
            if (!nuevaFecha) return;
            
            const nuevaHora = prompt('Nueva hora (HH:MM):');
            if (!nuevaHora) return;
            
            const observaciones = prompt('Observaciones:', '');
            
            const response = await fetch('api/agenda-data.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    accion: 'actualizar_agenda',
                    orden_numero: numeroOrden,
                    fecha_agenda: nuevaFecha,
                    hora_inicio: nuevaHora + ':00',
                    hora_fin: null,
                    observaciones: observaciones || ''
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('Agenda actualizada', 'success');
                cerrarModalDetalles();
                await recargarAgenda();
            } else {
                showNotification(data.message || 'Error al actualizar', 'error');
            }
            
        } catch (error) {
            console.error('❌ Error actualizando agenda:', error);
            showNotification('Error de conexión', 'error');
        }
    };
    
    function mostrarErrorAgenda(mensaje) {
        if (!agendaContainer) return;
        
        agendaContainer.innerHTML = `
            <div class="error-agenda">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h2>Error al cargar la agenda</h2>
                <p>${mensaje}</p>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="recargarAgenda()">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </div>
            </div>
        `;
    }

});