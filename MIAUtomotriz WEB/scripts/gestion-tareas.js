// gestion-tareas.js - Versión simplificada

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard empleado cargado');
    
    // ============================================
    // 1. SISTEMA DE TEMA OSCURO
    // ============================================
    
    // Inicializar tema
    const themeToggle = document.getElementById('themeToggle');
    
    if (themeToggle) {
        // Cargar tema guardado o usar preferencia del sistema
        const savedTheme = localStorage.getItem('miAutomotriz-tema-empleado');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        let theme = 'light';
        if (savedTheme) {
            theme = savedTheme;
        } else if (systemPrefersDark) {
            theme = 'dark';
        }
        
        // Aplicar tema inicial
        document.documentElement.setAttribute('data-theme', theme);
        
        // Evento para cambiar tema
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('miAutomotriz-tema-empleado', newTheme);
            
            console.log('Tema cambiado a:', newTheme);
        });
    }
    
    // ============================================
    // 2. FUNCIONALIDADES BÁSICAS
    // ============================================
    
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
    
    // Toggle sidebar móvil
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
    
    // Toggle descanso
    const breakToggle = document.getElementById('breakToggle');
    if (breakToggle) {
        breakToggle.addEventListener('click', function() {
            const isOnBreak = this.classList.toggle('on-break');
            const text = this.querySelector('span');
            
            if (isOnBreak) {
                text.textContent = 'En Descanso';
                showNotification('Has iniciado tu descanso', 'info');
            } else {
                text.textContent = 'Descanso';
                showNotification('Has finalizado tu descanso', 'success');
            }
        });
    }
    
    // Función de notificación
    function showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 
                                   type === 'warning' ? 'exclamation-triangle' : 
                                   type === 'error' ? 'times-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Estilos básicos
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : 
                         type === 'warning' ? '#f59e0b' : 
                         type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Agregar animaciones CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    console.log('✅ Dashboard inicializado correctamente');
});