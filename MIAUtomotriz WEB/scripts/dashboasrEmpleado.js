// dashboard-empleado.js - Con modo oscuro

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard empleado cargado - Inicializando...');
    
    // ============================================
    // 1. SISTEMA DE TEMA OSCURO
    // ============================================
    
    class ThemeManager {
        constructor() {
            this.themeToggle = document.getElementById('themeToggle');
            this.init();
        }
        
        init() {
            if (!this.themeToggle) {
                console.error('❌ Botón de tema no encontrado');
                return;
            }
            
            console.log('✅ Botón de tema encontrado');
            
            // Cargar tema inicial
            this.loadInitialTheme();
            
            // Vincular eventos
            this.bindEvents();
            
            console.log('✅ Sistema de tema inicializado');
        }
        
        loadInitialTheme() {
            // 1. Verificar localStorage
            const savedTheme = localStorage.getItem('miAutomotriz-tema-empleado');
            
            // 2. Verificar preferencia del sistema
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            // 3. Decidir tema inicial
            let theme = 'light'; // Default
            if (savedTheme) {
                theme = savedTheme;
                console.log('Usando tema guardado:', theme);
            } else if (systemPrefersDark) {
                theme = 'dark';
                console.log('Usando preferencia del sistema:', theme);
            }
            
            // 4. Aplicar tema
            this.applyTheme(theme);
            console.log(`🌓 Tema inicial aplicado: ${theme}`);
        }
        
        applyTheme(theme) {
            // Establecer atributo en HTML
            document.documentElement.setAttribute('data-theme', theme);
            
            // Guardar en localStorage
            localStorage.setItem('miAutomotriz-tema-empleado', theme);
        }
        
        toggleTheme() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            console.log(`🔄 Cambiando tema: ${currentTheme} → ${newTheme}`);
            
            // Aplicar nuevo tema
            this.applyTheme(newTheme);
            
            // Mostrar feedback visual
            this.showThemeNotification(newTheme);
            
            return newTheme;
        }
        
        showThemeNotification(theme) {
            const message = theme === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado';
            
            // Crear notificación
            const notification = document.createElement('div');
            notification.textContent = `🌓 ${message}`;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${theme === 'dark' ? '#1f2937' : '#ffffff'};
                color: ${theme === 'dark' ? '#ffffff' : '#1f2937'};
                padding: 10px 15px;
                border-radius: 6px;
                border: 1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'};
                z-index: 9999;
                font-size: 14px;
                animation: fadeIn 0.3s ease;
            `;
            
            document.body.appendChild(notification);
            
            // Auto-remover
            setTimeout(() => {
                notification.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        }
        
        bindEvents() {
            // Evento click
            this.themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTheme();
            });
            
            // Evento teclado para accesibilidad
            this.themeToggle.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleTheme();
                }
            });
        }
    }
    
    // ============================================
    // 2. OTRAS FUNCIONALIDADES
    // ============================================
    
    // Estado de la sidebar
    let sidebarCollapsed = false;
    let onBreak = false;
    
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
        
        const dateTimeElement = document.getElementById('currentDateTime');
        if (dateTimeElement) {
            dateTimeElement.textContent = now.toLocaleDateString('es-ES', options);
        }
        
        // Actualizar fecha de hoy en la agenda
        const todayOptions = { weekday: 'long', day: 'numeric', month: 'long' };
        const todayDateElement = document.getElementById('todayDate');
        if (todayDateElement) {
            todayDateElement.textContent = now.toLocaleDateString('es-ES', todayOptions);
        }
    }
    
    // Toggle estado de descanso
    function initBreakToggle() {
        const breakToggle = document.getElementById('breakToggle');
        if (!breakToggle) return;
        
        const breakText = breakToggle.querySelector('span');
        
        breakToggle.addEventListener('click', function() {
            onBreak = !onBreak;
            
            if (onBreak) {
                breakToggle.classList.add('on-break');
                breakText.textContent = 'En Descanso';
                showNotification('Has iniciado tu descanso', 'info');
            } else {
                breakToggle.classList.remove('on-break');
                breakText.textContent = 'En Turno';
                showNotification('Has finalizado tu descanso', 'success');
            }
        });
    }
    
    // Manejar acciones de tareas
    function initTaskActions() {
        const pauseButtons = document.querySelectorAll('.task-btn.pause');
        const completeButtons = document.querySelectorAll('.task-btn.complete');
        
        pauseButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const taskItem = this.closest('.task-item');
                const taskName = taskItem.querySelector('h4').textContent;
                showNotification(`Tarea pausada: ${taskName}`, 'warning');
            });
        });
        
        completeButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const taskItem = this.closest('.task-item');
                const taskName = taskItem.querySelector('h4').textContent;
                taskItem.style.opacity = '0.6';
                setTimeout(() => {
                    taskItem.remove();
                    updateQuickStats();
                }, 300);
                showNotification(`Tarea completada: ${taskName}`, 'success');
            });
        });
    }
    
    // Actualizar estadísticas rápidas
    function updateQuickStats() {
        const inProgress = document.querySelectorAll('.task-item').length;
        const completedToday = 12 + (3 - inProgress); // Simulación
        
        const progressElement = document.querySelector('.quick-stat-card:nth-child(1) h3');
        const completedElement = document.querySelector('.quick-stat-card:nth-child(3) h3');
        
        if (progressElement) progressElement.textContent = inProgress;
        if (completedElement) completedElement.textContent = completedToday;
    }
    
    // Notificaciones
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
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
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animación de entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto-remover después de 3 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    function getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'warning': 'exclamation-triangle',
            'error': 'times-circle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
    
    function getNotificationColor(type) {
        const colors = {
            'success': '#10b981',
            'warning': '#f59e0b',
            'error': '#ef4444',
            'info': '#3b82f6'
        };
        return colors[type] || '#3b82f6';
    }
    
    // Agregar animaciones CSS
    function addAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Toggle sidebar en móvil
    function initSidebarToggle() {
        const menuToggle = document.querySelector('.menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
            
            // Cerrar sidebar al hacer clic fuera en móvil
            document.addEventListener('click', (event) => {
                if (window.innerWidth <= 768) {
                    if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
                        sidebar.classList.remove('active');
                    }
                }
            });
        }
    }
    
    // ============================================
    // 3. INICIALIZACIÓN PRINCIPAL
    // ============================================
    
    function initDashboard() {
        console.log('🚀 Inicializando dashboard empleado...');
        
        // 1. Agregar animaciones CSS
        addAnimations();
        
        // 2. Inicializar sistema de tema (IMPORTANTE: Primero)
        const themeManager = new ThemeManager();
        
        // 3. Otras funcionalidades
        updateDateTime();
        setInterval(updateDateTime, 1000);
        
        initSidebarToggle();
        initBreakToggle();
        initTaskActions();
        
        // 4. Efecto de carga suave
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.3s ease';
        
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 100);
        
        console.log('✅ Dashboard empleado completamente inicializado');
    }
    
    // Iniciar todo
    initDashboard();
});