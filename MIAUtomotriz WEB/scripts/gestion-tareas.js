// scripts/gestion-tareas.js - Versión actualizada para integración con API

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Gestión de Tareas - Inicializando...');
    
    // Variables globales
    let tareas = [];
    let tareasFiltradas = [];
    let filtroActual = 'todas';
    let paginaActual = 1;
    const tareasPorPagina = 10;
    
    // Elementos DOM
    let urgentCountElement = document.getElementById('urgent-count');
    let progressCountElement = document.getElementById('progress-count');
    let completedCountElement = document.getElementById('completed-count');
    let pendingCountElement = document.getElementById('pending-count');
    let tareasProgresoContainer = document.getElementById('tareas-progreso-container');
    let tareasCompletadasContainer = document.getElementById('tareas-completadas-container');
    let emptyProgress = document.getElementById('empty-progress');
    let emptyCompleted = document.getElementById('empty-completed');
    
    // Inicializar
    init();
    
    async function init() {
        try {
            // Configurar tema oscuro
            initTheme();
            
            // Actualizar hora
            updateTime();
            setInterval(updateTime, 1000);
            
            // Cargar tareas
            await cargarTareas();
            
            // Renderizar estadísticas
            actualizarEstadisticas();
            
            // Renderizar tareas
            renderizarTareasProgreso();
            renderizarTareasCompletadas();
            
            // Inicializar event listeners
            initEventListeners();
            
            console.log('✅ Gestión de Tareas inicializada');
            
        } catch (error) {
            console.error('❌ Error inicializando:', error);
            mostrarError('Error al cargar las tareas');
        }
    }
    
    // ==================== CARGAR TAREAS ====================
    async function cargarTareas() {
        try {
            mostrarLoading();
            
            const params = new URLSearchParams({
                accion: 'obtener_tareas_asignadas',
                estado: 'todos',
                pagina: paginaActual,
                por_pagina: tareasPorPagina
            });
            
            const response = await fetch(`api/ordenes-empleado.php?${params}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                tareas = data.tareas || [];
                tareasFiltradas = [...tareas];
                console.log(`✅ ${tareas.length} tareas cargadas`);
            } else {
                throw new Error(data.error || 'Error al cargar tareas');
            }
            
        } catch (error) {
            console.error('❌ Error cargando tareas:', error);
            // Usar datos de ejemplo si falla la API
            tareas = obtenerDatosEjemplo();
            tareasFiltradas = [...tareas];
            console.log('⚠️ Usando datos de ejemplo');
        } finally {
            ocultarLoading();
        }
    }
    
    // ==================== RENDERIZAR INTERFAZ ====================
    function actualizarEstadisticas() {
        const urgentes = tareas.filter(t => t.estado === 'Urgente').length;
        const enProgreso = tareas.filter(t => t.estado === 'En Proceso').length;
        const completadas = tareas.filter(t => t.estado === 'Completada').length;
        const pendientes = tareas.filter(t => t.estado === 'Pendiente').length;
        
        if (urgentCountElement) urgentCountElement.textContent = urgentes;
        if (progressCountElement) progressCountElement.textContent = enProgreso;
        if (completedCountElement) completedCountElement.textContent = completadas;
        if (pendingCountElement) pendingCountElement.textContent = pendientes;
    }
    
    function renderizarTareasProgreso() {
        if (!tareasProgresoContainer) return;
        
        const tareasEnProgreso = tareas.filter(t => 
            t.estado === 'En Proceso' || 
            t.estado === 'Urgente' || 
            t.estado === 'Pendiente'
        );
        
        if (tareasEnProgreso.length === 0) {
            if (emptyProgress) {
                emptyProgress.style.display = 'flex';
            }
            return;
        }
        
        if (emptyProgress) {
            emptyProgress.style.display = 'none';
        }
        
        tareasProgresoContainer.innerHTML = tareasEnProgreso.map(tarea => `
            <div class="task-item ${tarea.estado === 'Urgente' ? 'urgent' : ''}" 
                 data-tarea="${tarea.numero}">
                <div class="task-info">
                    <div class="task-header">
                        <h4>${escapeHTML(tarea.descripcion || 'Sin descripción')}</h4>
                        <span class="task-time">
                            ${tarea.hora_inicio ? tarea.hora_inicio.substr(0, 5) : 'Sin hora'}
                        </span>
                    </div>
                    <p class="task-desc">
                        ${tarea.vehiculo_id || 'Sin patente'} • 
                        ${tarea.cliente_nombre || 'Cliente desconocido'}
                        ${tarea.marca ? ` • ${tarea.marca} ${tarea.modelo || ''}` : ''}
                    </p>
                    <div class="task-tags">
                        <span class="task-tag status-${tarea.estado ? tarea.estado.toLowerCase() : 'pendiente'}">
                            ${tarea.estado || 'Pendiente'}
                        </span>
                        ${tarea.averias ? `
                            <span class="task-tag tag-averia">
                                <i class="fas fa-tools"></i> ${tarea.averias.split(',')[0]}
                            </span>
                        ` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    ${tarea.estado !== 'Completada' ? `
                        <button class="task-btn pause" onclick="pausarTarea(${tarea.numero})">
                            <i class="fas fa-pause"></i>
                        </button>
                        <button class="task-btn complete" onclick="completarTarea(${tarea.numero})">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    <button class="task-btn details" onclick="verDetallesTarea(${tarea.numero})">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    function renderizarTareasCompletadas() {
        if (!tareasCompletadasContainer) return;
        
        const tareasCompletadas = tareas.filter(t => t.estado === 'Completada')
                                         .slice(0, 5); // Mostrar solo las 5 más recientes
        
        if (tareasCompletadas.length === 0) {
            if (emptyCompleted) {
                emptyCompleted.style.display = 'flex';
            }
            return;
        }
        
        if (emptyCompleted) {
            emptyCompleted.style.display = 'none';
        }
        
        tareasCompletadasContainer.innerHTML = tareasCompletadas.map(tarea => `
            <div class="task-item completed" data-tarea="${tarea.numero}">
                <div class="task-info">
                    <div class="task-header">
                        <h4>${escapeHTML(tarea.descripcion || 'Sin descripción')}</h4>
                        <span class="task-time">
                            ${tarea.fecha_agenda ? formatFecha(tarea.fecha_agenda) : 'Sin fecha'}
                        </span>
                    </div>
                    <p class="task-desc">
                        ${tarea.vehiculo_id || 'Sin patente'} • 
                        ${tarea.cliente_nombre || 'Cliente desconocido'}
                    </p>
                    <div class="task-completed-info">
                        <i class="fas fa-check-circle"></i>
                        <span>Completada</span>
                        ${tarea.fecha_completacion ? `
                            <span class="completion-date">
                                el ${formatFecha(tarea.fecha_completacion)}
                            </span>
                        ` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-btn details" onclick="verDetallesTarea(${tarea.numero})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="task-btn report" onclick="generarReporte(${tarea.numero})">
                        <i class="fas fa-file-alt"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // ==================== FUNCIONALIDADES ====================
    async function verDetallesTarea(numeroTarea) {
        try {
            mostrarLoadingModal();
            
            const response = await fetch(`api/ordenes-empleado.php?accion=obtener_tarea_detalle&numero=${numeroTarea}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success) {
                mostrarModalDetalles(data.tarea, data.repuestos);
            } else {
                throw new Error(data.message || 'Error al cargar detalles');
            }
            
        } catch (error) {
            console.error('❌ Error cargando detalles:', error);
            mostrarNotificacion('Error al cargar detalles de la tarea', 'error');
        } finally {
            ocultarLoadingModal();
        }
    }
    
    async function pausarTarea(numeroTarea) {
        try {
            const nuevaObservacion = prompt('Ingrese observaciones para la pausa:');
            if (nuevaObservacion === null) return;
            
            const response = await fetch('api/ordenes-empleado.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    accion: 'actualizar_estado',
                    numero_tarea: numeroTarea,
                    estado: 'En Pausa',
                    observaciones: nuevaObservacion
                }),
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success) {
                mostrarNotificacion('Tarea pausada correctamente', 'success');
                await cargarTareas();
                renderizarTareasProgreso();
                actualizarEstadisticas();
            } else {
                throw new Error(data.message);
            }
            
        } catch (error) {
            console.error('❌ Error pausando tarea:', error);
            mostrarNotificacion('Error al pausar la tarea', 'error');
        }
    }
    
    async function completarTarea(numeroTarea) {
        try {
            // Pedir tiempo empleado
            const tiempoEmpleado = prompt('Ingrese el tiempo empleado (ej: 2h 30m):');
            if (tiempoEmpleado === null) return;
            
            const observacionesFinales = prompt('Observaciones finales (opcional):', '');
            
            const response = await fetch('api/ordenes-empleado.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    accion: 'marcar_completada',
                    numero_tarea: numeroTarea,
                    tiempo_empleado: tiempoEmpleado,
                    observaciones_finales: observacionesFinales || ''
                }),
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success) {
                mostrarNotificacion('Tarea completada correctamente', 'success');
                await cargarTareas();
                renderizarTareasProgreso();
                renderizarTareasCompletadas();
                actualizarEstadisticas();
            } else {
                throw new Error(data.message);
            }
            
        } catch (error) {
            console.error('❌ Error completando tarea:', error);
            mostrarNotificacion('Error al completar la tarea', 'error');
        }
    }
    
    // ==================== FUNCIONES AUXILIARES ====================
    function initTheme() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;
        
        // Cargar tema guardado
        const savedTheme = localStorage.getItem('miAutomotriz-tema-empleado');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        let theme = 'light';
        if (savedTheme) {
            theme = savedTheme;
        } else if (systemPrefersDark) {
            theme = 'dark';
        }
        
        document.documentElement.setAttribute('data-theme', theme);
        
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('miAutomotriz-tema-empleado', newTheme);
        });
    }
    
    function updateTime() {
        const now = new Date();
        
        // Actualizar hora en header
        const dateTimeElement = document.getElementById('currentDateTime');
        if (dateTimeElement) {
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            };
            dateTimeElement.textContent = now.toLocaleDateString('es-ES', options);
        }
        
        // Actualizar fecha actual
        const currentDateElement = document.getElementById('current-date');
        if (currentDateElement) {
            currentDateElement.textContent = now.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
        
        // Actualizar hora actual
        const currentTimeElement = document.getElementById('current-time');
        if (currentTimeElement) {
            currentTimeElement.textContent = now.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
    
    function formatFecha(fechaStr) {
        if (!fechaStr) return 'Sin fecha';
        try {
            const fecha = new Date(fechaStr);
            return fecha.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return fechaStr;
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
    
    function mostrarLoadingModal() {
        // Mostrar spinner en modal
        console.log('⏳ Cargando detalles...');
    }
    
    function ocultarLoadingModal() {
        console.log('✅ Detalles cargados');
    }
    
    function mostrarModalDetalles(tarea, repuestos) {
        // Crear modal con detalles
        const modalHTML = `
            <div class="modal" id="task-detail-modal" style="display: block;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>
                            <i class="fas fa-clipboard-list"></i>
                            Tarea #${tarea.numero}
                            <span class="modal-status status-${tarea.estado ? tarea.estado.toLowerCase() : 'pendiente'}">
                                ${tarea.estado || 'Pendiente'}
                            </span>
                        </h3>
                        <button class="close-modal" onclick="cerrarModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <!-- Contenido del modal -->
                        <div class="detail-section">
                            <h4><i class="fas fa-info-circle"></i> Información General</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">Fecha Creación</span>
                                    <span class="detail-value">${formatFecha(tarea.fecha)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Vehículo</span>
                                    <span class="detail-value">
                                        ${tarea.vehiculo_id || 'Sin patente'} - 
                                        ${tarea.marca || ''} ${tarea.modelo || ''}
                                    </span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Cliente</span>
                                    <span class="detail-value">${tarea.cliente_nombre || 'No especificado'}</span>
                                </div>
                                ${tarea.cliente_telefono ? `
                                    <div class="detail-item">
                                        <span class="detail-label">Teléfono</span>
                                        <span class="detail-value">${tarea.cliente_telefono}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        ${tarea.descripcion ? `
                            <div class="detail-section">
                                <h4><i class="fas fa-file-alt"></i> Descripción</h4>
                                <p>${escapeHTML(tarea.descripcion)}</p>
                            </div>
                        ` : ''}
                        
                        ${tarea.averias ? `
                            <div class="detail-section">
                                <h4><i class="fas fa-tools"></i> Averías</h4>
                                <div class="averias-list">
                                    ${tarea.averias.split(', ').map(averia => `
                                        <div class="averia-item">
                                            <i class="fas fa-wrench"></i>
                                            <span>${averia}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${repuestos && repuestos.length > 0 ? `
                            <div class="detail-section">
                                <h4><i class="fas fa-cogs"></i> Repuestos Utilizados</h4>
                                <div class="repuestos-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Repuesto</th>
                                                <th>Cantidad</th>
                                                <th>Costo Unitario</th>
                                                <th>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${repuestos.map(repuesto => `
                                                <tr>
                                                    <td>${repuesto.nombre}</td>
                                                    <td>${repuesto.cantidad_instalada}</td>
                                                    <td>$${parseFloat(repuesto.costo_unitario).toFixed(2)}</td>
                                                    <td>$${parseFloat(repuesto.cantidad_instalada * repuesto.costo_unitario).toFixed(2)}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ` : ''}
                        
                        ${tarea.fecha_agenda ? `
                            <div class="detail-section">
                                <h4><i class="fas fa-calendar-alt"></i> Programación</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <span class="detail-label">Fecha Agenda</span>
                                        <span class="detail-value">${formatFecha(tarea.fecha_agenda)}</span>
                                    </div>
                                    ${tarea.hora_inicio ? `
                                        <div class="detail-item">
                                            <span class="detail-label">Hora Inicio</span>
                                            <span class="detail-value">${tarea.hora_inicio.substr(0, 5)}</span>
                                        </div>
                                    ` : ''}
                                    ${tarea.hora_fin ? `
                                        <div class="detail-item">
                                            <span class="detail-label">Hora Fin</span>
                                            <span class="detail-value">${tarea.hora_fin.substr(0, 5)}</span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-actions">
                        ${tarea.estado !== 'Completada' ? `
                            <button class="btn btn-primary" onclick="completarTarea(${tarea.numero}); cerrarModal();">
                                <i class="fas fa-check-circle"></i> Marcar como Completada
                            </button>
                        ` : ''}
                        <button class="btn btn-secondary" onclick="cerrarModal()">
                            <i class="fas fa-times"></i> Cerrar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Insertar modal en el DOM
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        
        // Agregar event listener para cerrar modal
        const modal = document.getElementById('task-detail-modal');
        const closeBtn = modal.querySelector('.close-modal');
        
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });
        
        // Cerrar al hacer clic fuera del contenido
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    function cerrarModal() {
        const modal = document.getElementById('task-detail-modal');
        if (modal) {
            modal.remove();
        }
    }
    
    function mostrarNotificacion(mensaje, tipo = 'info') {
        // Crear notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${tipo}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${tipo === 'success' ? 'check-circle' : 
                                   tipo === 'error' ? 'times-circle' : 
                                   tipo === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${mensaje}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animación de entrada
        setTimeout(() => {
            notification.style.transform = 'translateY(0)';
            notification.style.opacity = '1';
        }, 10);
        
        // Auto-remover
        setTimeout(() => {
            notification.style.transform = 'translateY(-100%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    function mostrarError(mensaje) {
        const errorHTML = `
            <div class="error-container">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Error</h3>
                <p>${mensaje}</p>
                <button onclick="location.reload()" class="btn btn-primary">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = errorHTML;
        }
    }
    
    function obtenerDatosEjemplo() {
        // Datos de ejemplo para desarrollo
        return [
            {
                numero: 1001,
                fecha: '2024-01-15',
                descripcion: 'Cambio de aceite y filtro',
                estado: 'En Proceso',
                vehiculo_id: 'ABC123',
                cliente_nombre: 'Juan Pérez',
                marca: 'Toyota',
                modelo: 'Corolla',
                averias: 'Cambio de aceite',
                fecha_agenda: '2024-01-16',
                hora_inicio: '09:00:00'
            },
            {
                numero: 1002,
                fecha: '2024-01-15',
                descripcion: 'Revisión de frenos',
                estado: 'Urgente',
                vehiculo_id: 'XYZ789',
                cliente_nombre: 'María López',
                marca: 'Honda',
                modelo: 'Civic',
                averias: 'Revisión frenos',
                fecha_agenda: '2024-01-16',
                hora_inicio: '10:30:00'
            },
            {
                numero: 1003,
                fecha: '2024-01-14',
                descripcion: 'Alineación y balanceo',
                estado: 'Completada',
                vehiculo_id: 'DEF456',
                cliente_nombre: 'Carlos Ruiz',
                marca: 'Nissan',
                modelo: 'Sentra',
                averias: 'Alineación',
                fecha_agenda: '2024-01-15',
                hora_inicio: '14:00:00'
            }
        ];
    }
    
    // ==================== FUNCIONES GLOBALES ====================
    window.filtrarTareas = function(filtro) {
        filtroActual = filtro;
        
        // Actualizar botones activos
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        switch (filtro) {
            case 'todas':
                tareasFiltradas = [...tareas];
                break;
            case 'urgentes':
                tareasFiltradas = tareas.filter(t => t.estado === 'Urgente');
                break;
            case 'hoy':
                const hoy = new Date().toISOString().split('T')[0];
                tareasFiltradas = tareas.filter(t => t.fecha_agenda === hoy);
                break;
            case 'completadas':
                tareasFiltradas = tareas.filter(t => t.estado === 'Completada');
                break;
        }
        
        renderizarTareasProgreso();
        actualizarEstadisticas();
    };
    
    window.verTodasTareas = function() {
        alert('Funcionalidad: Ver todas las tareas (implementar paginación)');
    };
    
    window.verHistorialCompletadas = async function() {
        try {
            const response = await fetch('api/ordenes-empleado.php?accion=obtener_historial', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Mostrar modal con historial
                mostrarModalHistorial(data.historial);
            } else {
                throw new Error(data.error);
            }
            
        } catch (error) {
            console.error('❌ Error cargando historial:', error);
            mostrarNotificacion('Error al cargar historial', 'error');
        }
    };
    
    window.marcarTodasCompletadas = function() {
        if (!confirm('¿Está seguro de marcar todas las tareas como completadas?')) {
            return;
        }
        mostrarNotificacion('Funcionalidad en desarrollo', 'info');
    };
    
    window.exportarReporte = function() {
        mostrarNotificacion('Generando reporte...', 'info');
        // Implementar generación de reporte
    };
    
    window.solicitarNuevasTareas = function() {
        mostrarNotificacion('Solicitud enviada al administrador', 'info');
    };
    
    window.generarReporte = function(numeroTarea) {
        window.open(`reporte-tarea.php?numero=${numeroTarea}`, '_blank');
    };
    
    // ==================== INICIALIZAR EVENT LISTENERS ====================
    function initEventListeners() {
        // Toggle sidebar móvil
        const menuToggle = document.querySelector('.menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }
        
        // Actualizar periódicamente (cada 30 segundos)
        setInterval(async () => {
            await cargarTareas();
            actualizarEstadisticas();
            renderizarTareasProgreso();
            renderizarTareasCompletadas();
        }, 30000);
    }
});