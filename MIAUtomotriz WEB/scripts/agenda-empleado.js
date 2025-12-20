// agenda-empleado.js - Sistema de agenda para empleados

document.addEventListener('DOMContentLoaded', function() {
    console.log('📅 Inicializando Agenda de Empleado');
    
    // Variables globales
    let ordenesDisponibles = [];
    let ordenesAgendadas = [];
    let calendarioSemana = [];
    let fechaInicioSemana;
    let fechaFinSemana;
    let ordenSeleccionada = null;
    
    // Elementos DOM
    let agendaContainer = null;
    let modal = null;
    let closeModal = null;
    
    // Inicializar
    init();
    
    async function init() {
        try {
            // Crear estructura HTML inicial
            crearEstructuraBase();
            
            // Cargar datos
            await cargarDatos();
            
            // Renderizar interfaz con datos
            renderizarInterfaz();
            
            // Inicializar event listeners
            initEventListeners();
            
        } catch (error) {
            console.error('❌ Error inicializando agenda:', error);
            mostrarError('Error al cargar la agenda');
        }
    }

        // Actualizar hora
    function updateTime() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const timeElement = document.getElementById('currentDateTime');
        if (timeElement) {
            timeElement.textContent = dateStr;
        }
    }
    
    // Iniciar actualización de hora
    updateTime();
    setInterval(updateTime, 1000);
    
    // ==================== CREAR ESTRUCTURA BASE ====================
    function crearEstructuraBase() {
        // Crear contenedor principal si no existe
        const mainContainer = document.getElementById('agenda-container');
        if (!mainContainer) return;
        
        agendaContainer = mainContainer;
        
        // Crear estructura base de la agenda
        agendaContainer.innerHTML = `
            <div class="agenda-container">
                <!-- Lista de órdenes disponibles -->
                <div class="agenda-card">
                    <div class="card-header">
                        <h2>
                            <i class="fas fa-clipboard-list"></i>
                            Órdenes Disponibles
                            <span class="card-badge loading-badge">...</span>
                        </h2>
                    </div>
                    <div class="card-body">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                            <p>Cargando órdenes disponibles...</p>
                        </div>
                    </div>
                </div>
                
                <!-- Calendario semanal -->
                <div class="agenda-card">
                    <div class="card-header">
                        <h2>
                            <i class="fas fa-calendar-week"></i>
                            Mi Agenda Semanal
                            <span class="card-badge loading-badge">...</span>
                        </h2>
                    </div>
                    <div class="card-body">
                        <div class="week-calendar">
                            <div class="week-header">
                                <div class="day-header">Lun</div>
                                <div class="day-header">Mar</div>
                                <div class="day-header">Mié</div>
                                <div class="day-header">Jue</div>
                                <div class="day-header">Vie</div>
                                <div class="day-header">Sáb</div>
                                <div class="day-header">Dom</div>
                            </div>
                            <div class="week-grid">
                                <div class="day-cell">
                                    <div class="day-number">...</div>
                                    <div class="day-orders"></div>
                                </div>
                                <div class="day-cell">
                                    <div class="day-number">...</div>
                                    <div class="day-orders"></div>
                                </div>
                                <div class="day-cell">
                                    <div class="day-number">...</div>
                                    <div class="day-orders"></div>
                                </div>
                                <div class="day-cell">
                                    <div class="day-number">...</div>
                                    <div class="day-orders"></div>
                                </div>
                                <div class="day-cell">
                                    <div class="day-number">...</div>
                                    <div class="day-orders"></div>
                                </div>
                                <div class="day-cell">
                                    <div class="day-number">...</div>
                                    <div class="day-orders"></div>
                                </div>
                                <div class="day-cell">
                                    <div class="day-number">...</div>
                                    <div class="day-orders"></div>
                                </div>
                            </div>
                        </div>
                        <div class="week-controls">
                            <div class="week-navigation">
                                <button class="btn-week" onclick="cambiarSemana(-1)">
                                    <i class="fas fa-chevron-left"></i>
                                    Semana anterior
                                </button>
                                <div class="current-week">
                                    Cargando semana...
                                </div>
                                <button class="btn-week" onclick="cambiarSemana(1)">
                                    Semana siguiente
                                    <i class="fas fa-chevron-right"></i>
                                </button>
                            </div>
                            <button class="btn-today" onclick="irAHoy()">
                                <i class="fas fa-calendar-day"></i>
                                Hoy
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Modal para detalles -->
            <div id="ordenModal" class="modal">
                <div class="modal-content">
                    <!-- El contenido del modal se cargará dinámicamente -->
                </div>
            </div>
        `;
        
        // Inicializar referencias a elementos del modal
        modal = document.getElementById('ordenModal');
        closeModal = document.querySelector('.close-modal');
    }
    
    // ==================== CARGAR DATOS ====================
    async function cargarDatos() {
        console.log('📡 Cargando datos de órdenes...');
        
        try {
            // Calcular fechas de la semana actual
            const hoy = new Date();
            const inicioSemana = new Date(hoy);
            inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1); // Lunes
            
            fechaInicioSemana = inicioSemana.toISOString().split('T')[0];
            fechaFinSemana = new Date(inicioSemana);
            fechaFinSemana.setDate(inicioSemana.getDate() + 6); // Domingo
            fechaFinSemana = fechaFinSemana.toISOString().split('T')[0];
            
            const url = `api/get-ordenes-empleado.php?fecha_inicio=${fechaInicioSemana}&fecha_fin=${fechaFinSemana}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const responseText = await response.text();
            
            // Verificar si es HTML
            if (responseText.includes('<') || responseText.includes('Parse error') || responseText.includes('Fatal error')) {
                throw new Error('El servidor devolvió HTML/error PHP');
            }
            
            const data = JSON.parse(responseText);
            
            if (!data.success) {
                // Si hay error, usar datos vacíos pero mantener estructura
                console.warn('⚠️ Error en API:', data.message);
                ordenesDisponibles = [];
                ordenesAgendadas = [];
                calendarioSemana = [];
                return;
            }
            
            // Asignar datos
            ordenesDisponibles = data.ordenes_disponibles || [];
            ordenesAgendadas = data.ordenes_agendadas || [];
            calendarioSemana = data.calendario || [];
            
            console.log(`✅ ${ordenesDisponibles.length} órdenes disponibles cargadas`);
            console.log(`✅ ${ordenesAgendadas.length} órdenes agendadas cargadas`);
            
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            // Mantener arrays vacíos para mantener la estructura
            ordenesDisponibles = [];
            ordenesAgendadas = [];
            calendarioSemana = [];
        }
    }
    
    // ==================== RENDERIZAR INTERFAZ ====================
    function renderizarInterfaz() {
        if (!agendaContainer) return;
        
        // Actualizar badges con números reales
        const badges = agendaContainer.querySelectorAll('.card-badge');
        if (badges[0]) badges[0].textContent = ordenesDisponibles.length;
        if (badges[1]) badges[1].textContent = ordenesAgendadas.length;
        badges.forEach(badge => badge.classList.remove('loading-badge'));
        
        // Actualizar lista de órdenes disponibles
        const cardBodyDisponibles = agendaContainer.querySelector('.agenda-card:first-child .card-body');
        if (cardBodyDisponibles) {
            cardBodyDisponibles.innerHTML = renderizarOrdenesDisponibles();
        }
        
        // Actualizar calendario
        const cardBodyCalendario = agendaContainer.querySelector('.agenda-card:nth-child(2) .card-body');
        if (cardBodyCalendario) {
            const weekCalendar = cardBodyCalendario.querySelector('.week-calendar');
            const weekControls = cardBodyCalendario.querySelector('.week-controls');
            
            if (weekCalendar) {
                weekCalendar.innerHTML = renderizarCalendario();
            }
            
            if (weekControls) {
                weekControls.innerHTML = renderizarControlesSemana();
            }
        }
        
        // Actualizar texto de semana actual
        const currentWeek = agendaContainer.querySelector('.current-week');
        if (currentWeek) {
            const inicio = new Date(fechaInicioSemana);
            const fin = new Date(fechaFinSemana);
            
            const formatoFecha = (fecha) => {
                return fecha.toLocaleDateString('es-ES', { 
                    day: '2-digit', 
                    month: 'short' 
                });
            };
            
            currentWeek.textContent = `${formatoFecha(inicio)} - ${formatoFecha(fin)}`;
        }
    }
    
    function renderizarOrdenesDisponibles() {
        if (ordenesDisponibles.length === 0) {
            return `
                <div class="empty-message">
                    <i class="fas fa-clipboard-check"></i>
                    <h3>¡No hay órdenes disponibles!</h3>
                    <p>Todas las órdenes han sido asignadas o están en proceso.</p>
                    <button onclick="recargarDatos()" class="btn-refresh">
                        <i class="fas fa-redo"></i> Actualizar
                    </button>
                </div>
            `;
        }
        
        return `
            <div class="orders-list">
                ${ordenesDisponibles.map(orden => `
                    <div class="order-item" data-orden="${orden.Numero}">
                        <div class="order-header">
                            <span class="order-number">Orden #${orden.Numero}</span>
                            <span class="order-status status-${orden.Estado ? orden.Estado.toLowerCase() : 'pendiente'}">
                                ${orden.Estado || 'Pendiente'}
                            </span>
                        </div>
                        <div class="order-details">
                            <div class="order-vehicle">
                                <i class="fas fa-car"></i>
                                ${orden.Patente || 'Sin patente'} - ${orden.marca || ''} ${orden.modelo || ''}
                            </div>
                            <div class="order-date">
                                <i class="far fa-calendar"></i>
                                ${orden.Fecha ? formatFecha(orden.Fecha) : 'Sin fecha'}
                            </div>
                            ${orden.Descripcion ? `
                                <div class="order-description">
                                    ${escapeHTML(orden.Descripcion)}
                                </div>
                            ` : ''}
                        </div>
                        <div class="order-actions">
                            <button class="btn-small btn-select" onclick="asignarOrden(${orden.Numero})">
                                <i class="fas fa-calendar-plus"></i>
                                Asignar a mi agenda
                            </button>
                            <button class="btn-small btn-details" onclick="mostrarDetallesOrden(${orden.Numero})">
                                <i class="fas fa-eye"></i>
                                Ver detalles
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    function renderizarCalendario() {
        const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        const hoy = new Date().toISOString().split('T')[0];
        
        let html = `
            <div class="week-header">
                ${diasSemana.map(dia => `
                    <div class="day-header ${hoy === fechaInicioSemana ? 'today' : ''}">
                        ${dia}
                    </div>
                `).join('')}
            </div>
            <div class="week-grid">
        `;
        
        // Calcular fechas de la semana
        const fechaInicio = new Date(fechaInicioSemana);
        
        for (let i = 0; i < 7; i++) {
            const fecha = new Date(fechaInicio);
            fecha.setDate(fechaInicio.getDate() + i);
            const fechaStr = fecha.toISOString().split('T')[0];
            const diaNum = fecha.getDate();
            const esHoy = fechaStr === hoy;
            
            // Buscar órdenes para este día
            const ordenesDia = ordenesAgendadas.filter(orden => 
                orden.Fecha_Agenda === fechaStr
            );
            
            html += `
                <div class="day-cell ${esHoy ? 'today' : ''}">
                    <div class="day-number ${esHoy ? 'today' : ''}">
                        ${diaNum}
                    </div>
                    <div class="day-orders">
                        ${ordenesDia.length > 0 ? 
                            ordenesDia.map(orden => `
                                <div class="calendar-order status-${orden.Estado ? orden.Estado.toLowerCase() : 'pendiente'}" 
                                     onclick="mostrarDetallesOrden(${orden.Numero})"
                                     title="Orden #${orden.Numero} - ${orden.Patente || 'Sin patente'}">
                                    <div class="calendar-order-status"></div>
                                    <div class="calendar-order-number">#${orden.Numero}</div>
                                    <div>${orden.Patente || 'Sin patente'}</div>
                                    <small>${orden.Hora_Inicio ? orden.Hora_Inicio.substr(0, 5) : ''}</small>
                                </div>
                            `).join('')
                        : 
                            `<div class="empty-day">
                                <i class="far fa-calendar-times"></i>
                                <small>Sin órdenes</small>
                            </div>`
                        }
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }
    
    function renderizarControlesSemana() {
        const inicio = new Date(fechaInicioSemana);
        const fin = new Date(fechaFinSemana);
        
        const formatoFecha = (fecha) => {
            return fecha.toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: 'short' 
            });
        };
        
        return `
            <div class="week-controls">
                <div class="week-navigation">
                    <button class="btn-week" onclick="cambiarSemana(-1)">
                        <i class="fas fa-chevron-left"></i>
                        Semana anterior
                    </button>
                    <div class="current-week">
                        ${formatoFecha(inicio)} - ${formatoFecha(fin)}
                    </div>
                    <button class="btn-week" onclick="cambiarSemana(1)">
                        Semana siguiente
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                <button class="btn-today" onclick="irAHoy()">
                    <i class="fas fa-calendar-day"></i>
                    Hoy
                </button>
            </div>
        `;
    }
    
    function renderizarModalDetalles() {
        if (!ordenSeleccionada) return '';
        
        return `
            <div class="modal-header">
                <h3>
                    <i class="fas fa-clipboard"></i>
                    Orden #${ordenSeleccionada.Numero}
                </h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="modal-section">
                    <h4><i class="fas fa-info-circle"></i> Información General</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Estado</span>
                            <span class="detail-value status-${ordenSeleccionada.Estado ? ordenSeleccionada.Estado.toLowerCase() : 'pendiente'}">
                                ${ordenSeleccionada.Estado || 'Pendiente'}
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Fecha Creación</span>
                            <span class="detail-value">${ordenSeleccionada.Fecha ? formatFecha(ordenSeleccionada.Fecha) : 'No definida'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Vehículo</span>
                            <span class="detail-value">
                                ${ordenSeleccionada.Patente || 'Sin patente'} - 
                                ${ordenSeleccionada.marca || ''} ${ordenSeleccionada.modelo || ''}
                            </span>
                        </div>
                    </div>
                </div>
                
                ${ordenSeleccionada.Descripcion ? `
                <div class="modal-section">
                    <h4><i class="fas fa-file-alt"></i> Descripción</h4>
                    <p>${escapeHTML(ordenSeleccionada.Descripcion)}</p>
                </div>
                ` : ''}
                
                ${ordenSeleccionada.averias ? `
                <div class="modal-section">
                    <h4><i class="fas fa-tools"></i> Averías Reportadas</h4>
                    <div class="averias-list">
                        ${ordenSeleccionada.averias.split(', ').map(averia => `
                            <div class="averia-item">
                                <i class="fas fa-wrench"></i>
                                <span>${averia}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${ordenSeleccionada.Fecha_Agenda ? `
                <div class="modal-section">
                    <h4><i class="fas fa-calendar-alt"></i> Información de Agenda</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Fecha Asignada</span>
                            <span class="detail-value">${formatFecha(ordenSeleccionada.Fecha_Agenda)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Hora Inicio</span>
                            <span class="detail-value">${ordenSeleccionada.Hora_Inicio ? ordenSeleccionada.Hora_Inicio.substr(0, 5) : 'No definida'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Hora Fin</span>
                            <span class="detail-value">${ordenSeleccionada.Hora_Fin ? ordenSeleccionada.Hora_Fin.substr(0, 5) : 'No definida'}</span>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
            <div class="modal-actions">
                ${!ordenSeleccionada.Fecha_Agenda ? `
                <button class="btn-modal btn-modal-primary" onclick="asignarOrden(${ordenSeleccionada.Numero})">
                    <i class="fas fa-calendar-plus"></i>
                    Asignar a mi agenda
                </button>
                ` : ''}
                <button class="btn-modal btn-modal-secondary" onclick="cerrarModal()">
                    <i class="fas fa-times"></i>
                    Cerrar
                </button>
            </div>
        `;
    }
    
    // ==================== FUNCIONES DE INTERACCIÓN ====================
    function initEventListeners() {
        // Inicializar event listeners del modal cuando se crea
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('close-modal')) {
                cerrarModal();
            }
        });
        
        // Cerrar modal al hacer clic fuera
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    cerrarModal();
                }
            });
        }
    }
    
    // ==================== FUNCIONES GLOBALES ====================
    window.recargarDatos = async function() {
        try {
            // Mostrar loading
            const badges = document.querySelectorAll('.card-badge');
            badges.forEach(badge => {
                badge.textContent = '...';
                badge.classList.add('loading-badge');
            });
            
            // Mostrar spinner en listas
            const cardBodies = document.querySelectorAll('.card-body');
            cardBodies.forEach(body => {
                body.innerHTML = `
                    <div class="loading">
                        <div class="loading-spinner"></div>
                        <p>Cargando datos...</p>
                    </div>
                `;
            });
            
            // Recargar datos
            await cargarDatos();
            
            // Renderizar interfaz con nuevos datos
            renderizarInterfaz();
            
            // Mostrar notificación
            mostrarNotificacion('Datos actualizados', 'success');
            
        } catch (error) {
            console.error('❌ Error recargando datos:', error);
            mostrarNotificacion('Error al actualizar datos', 'error');
            
            // Aún así renderizar con datos vacíos
            renderizarInterfaz();
        }
    };
    
    window.cambiarSemana = async function(semanas) {
        try {
            const fechaInicio = new Date(fechaInicioSemana);
            fechaInicio.setDate(fechaInicio.getDate() + (semanas * 7));
            
            fechaInicioSemana = fechaInicio.toISOString().split('T')[0];
            fechaFinSemana = new Date(fechaInicio);
            fechaFinSemana.setDate(fechaInicio.getDate() + 6);
            fechaFinSemana = fechaFinSemana.toISOString().split('T')[0];
            
            await recargarDatos();
        } catch (error) {
            console.error('❌ Error cambiando semana:', error);
        }
    };
    
    window.irAHoy = async function() {
        try {
            const hoy = new Date();
            const inicioSemana = new Date(hoy);
            inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1);
            
            fechaInicioSemana = inicioSemana.toISOString().split('T')[0];
            fechaFinSemana = new Date(inicioSemana);
            fechaFinSemana.setDate(inicioSemana.getDate() + 6);
            fechaFinSemana = fechaFinSemana.toISOString().split('T')[0];
            
            await recargarDatos();
        } catch (error) {
            console.error('❌ Error yendo a hoy:', error);
        }
    };
    
    window.mostrarDetallesOrden = async function(numeroOrden) {
        try {
            // Buscar orden en disponibles o agendadas
            ordenSeleccionada = [...ordenesDisponibles, ...ordenesAgendadas]
                .find(orden => orden.Numero == numeroOrden);
            
            if (!ordenSeleccionada) {
                mostrarNotificacion('Orden no encontrada', 'error');
                return;
            }
            
            // Mostrar modal
            const modal = document.getElementById('ordenModal');
            if (modal) {
                modal.classList.add('active');
                const modalContent = modal.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.innerHTML = renderizarModalDetalles();
                    
                    // Agregar event listener al botón de cerrar
                    const closeBtn = modalContent.querySelector('.close-modal');
                    if (closeBtn) {
                        closeBtn.addEventListener('click', cerrarModal);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error mostrando detalles:', error);
            mostrarNotificacion('Error al mostrar detalles', 'error');
        }
    };
    
    window.asignarOrden = async function(numeroOrden) {
        try {
            const orden = ordenesDisponibles.find(o => o.Numero == numeroOrden);
            
            if (!orden) {
                mostrarNotificacion('Orden no disponible', 'error');
                return;
            }
            
            // Solicitar fecha y hora al usuario
            const hoy = new Date().toISOString().split('T')[0];
            const fechaHoy = new Date();
            const horaActual = `${fechaHoy.getHours().toString().padStart(2, '0')}:${fechaHoy.getMinutes().toString().padStart(2, '0')}`;
            
            const fechaAgenda = prompt('Ingrese fecha para la orden (YYYY-MM-DD):', hoy);
            if (!fechaAgenda) return;
            
            const horaInicio = prompt('Ingrese hora de inicio (HH:MM):', horaActual);
            if (!horaInicio) return;
            
            // Validar formato de fecha
            if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaAgenda)) {
                mostrarNotificacion('Formato de fecha inválido. Use YYYY-MM-DD', 'error');
                return;
            }
            
            // Validar formato de hora
            if (!/^\d{2}:\d{2}$/.test(horaInicio)) {
                mostrarNotificacion('Formato de hora inválido. Use HH:MM', 'error');
                return;
            }
            
            mostrarNotificacion('Asignando orden...', 'info');
            
            const response = await fetch('api/asignar-orden.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orden_numero: numeroOrden,
                    fecha_agenda: fechaAgenda,
                    hora_inicio: horaInicio + ':00',
                    hora_fin: null
                }),
                credentials: 'same-origin'
            });
            
            const result = await response.json();
            
            if (result.success) {
                mostrarNotificacion('Orden asignada exitosamente', 'success');
                await recargarDatos();
                cerrarModal();
            } else {
                mostrarNotificacion(result.message || 'Error al asignar orden', 'error');
            }
            
        } catch (error) {
            console.error('❌ Error asignando orden:', error);
            mostrarNotificacion('Error de conexión al servidor', 'error');
        }
    };
    
    window.cerrarModal = function() {
        try {
            ordenSeleccionada = null;
            const modal = document.getElementById('ordenModal');
            if (modal) {
                modal.classList.remove('active');
            }
        } catch (error) {
            console.error('❌ Error cerrando modal:', error);
        }
    };
    
    // ==================== FUNCIONES AUXILIARES ====================
    function formatFecha(fechaStr) {
        if (!fechaStr) return 'No definida';
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
    
    function mostrarError(mensaje) {
        if (!agendaContainer) return;
        
        agendaContainer.innerHTML = `
            <div class="error-message">
                <h2><i class="fas fa-exclamation-triangle"></i> Error</h2>
                <p>${escapeHTML(mensaje)}</p>
                <button onclick="recargarDatos()" class="btn-refresh">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
    }
    
    function mostrarNotificacion(mensaje, tipo = 'info', duracion = 3000) {
        console.log(`📢 ${tipo.toUpperCase()}: ${mensaje}`);
        
        // Crear notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${tipo}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 9999;
            box-shadow: var(--shadow-md);
            animation: slideIn 0.3s ease-out;
            max-width: 400px;
            word-wrap: break-word;
            background: ${tipo === 'success' ? 'var(--success-color)' : 
                        tipo === 'error' ? 'var(--error-color)' : 
                        tipo === 'warning' ? 'var(--warning-color)' : 
                        'var(--info-color)'};
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">
                    ${tipo === 'success' ? '✅' : 
                      tipo === 'error' ? '❌' : 
                      tipo === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                <span>${mensaje}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remover
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duracion);
    }
});