// dashboard-empleado.js

document.addEventListener('DOMContentLoaded', function() {
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
        document.getElementById('currentDateTime').textContent = 
            now.toLocaleDateString('es-ES', options);
        
        // Actualizar fecha de hoy en la agenda
        const todayOptions = { weekday: 'long', day: 'numeric', month: 'long' };
        document.getElementById('todayDate').textContent = 
            now.toLocaleDateString('es-ES', todayOptions);
    }

    // Cargar estado de la sidebar
    function loadSidebarState() {
        const savedState = localStorage.getItem('sidebarCollapsed');
        const sidebar = document.querySelector('.sidebar');
        
        if (savedState === 'true') {
            sidebarCollapsed = true;
            sidebar.classList.add('collapsed');
        } else {
            sidebarCollapsed = false;
            sidebar.classList.remove('collapsed');
        }
    }

    // Toggle estado de descanso
    function initBreakToggle() {
        const breakToggle = document.getElementById('breakToggle');
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
        
        document.querySelector('.quick-stat-card:nth-child(1) h3').textContent = inProgress;
        document.querySelector('.quick-stat-card:nth-child(3) h3').textContent = completedToday;
    }

    // Notificaciones
    function showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Estilos para la notificación
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border-left: 4px solid ${getNotificationColor(type)};
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

    // Agregar tooltips dinámicamente
    function initTooltips() {
        const menuItems = document.querySelectorAll('.menu-item');
        
        menuItems.forEach(item => {
            const link = item.querySelector('a');
            const text = link.querySelector('span').textContent;
            
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = text;
            
            item.appendChild(tooltip);
        });
    }

    // Navegación de fecha en agenda
    function initDateNavigation() {
        const prevBtn = document.querySelector('.nav-btn:first-child');
        const nextBtn = document.querySelector('.nav-btn:last-child');
        
        prevBtn.addEventListener('click', function() {
            showNotification('Navegando a día anterior', 'info');
        });
        
        nextBtn.addEventListener('click', function() {
            showNotification('Navegando a día siguiente', 'info');
        });
    }

    // Inicializar todas las funciones
    function initDashboard() {
        updateDateTime();
        setInterval(updateDateTime, 1000);
        loadSidebarState();
        initBreakToggle();
        initTaskActions();
        initTooltips();
        initDateNavigation();
        
        // Efecto de carga suave
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.3s ease';
        
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 100);
    }

    // Iniciar el dashboard
    initDashboard();
});
