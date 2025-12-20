<?php
// header-admin.php - Header específico para páginas de administrador

// Si no hay sesión iniciada, iniciar sesión
if (!isset($_SESSION)) {
    session_start();
}

// Configuración específica para administradores
$header_config = [
    'pageTitle' => $pageTitle ?? 'Panel de Administración',
    'notificationCount' => $notificationCount ?? 3,
    'showSearch' => $showSearch ?? true,
    'showMenuToggle' => $showMenuToggle ?? true,
    'showUserInfo' => $showUserInfo ?? false,
    
    // Valores por defecto (pueden ser sobrescritos)
    'userName' => $_SESSION['usuario'] ?? 'Administrador',
    'userRole' => $_SESSION['tipo_persona'] ?? 'Administrador',
    'userRUT' => $_SESSION['rut'] ?? ''
];

// Permitir sobrescribir desde la página que incluye
if (isset($headerConfig)) {
    $header_config = array_merge($header_config, $headerConfig);
}
?>

<header class="top-header admin-header">
    <div class="header-left">
        <?php if ($header_config['showMenuToggle']): ?>
        <button class="menu-toggle" aria-label="Alternar menú">
            <i class="fas fa-bars"></i>
        </button>
        <?php endif; ?>
        
        <h1>
            <i class="fas fa-tachometer-alt header-title-icon"></i>
            <?php echo htmlspecialchars($header_config['pageTitle']); ?>
        </h1>
    </div>
    
    <div class="header-right">
        <div class="header-actions">
            <!-- Notificaciones -->
            <button class="notification-btn" aria-label="Notificaciones" data-badge="<?php echo $header_config['notificationCount']; ?>">
                <i class="fas fa-bell"></i>
                <?php if ($header_config['notificationCount'] > 0): ?>
                <span class="notification-badge"><?php echo $header_config['notificationCount']; ?></span>
                <?php endif; ?>
            </button>
            
            <!-- Búsqueda (solo admin) -->
            <?php if ($header_config['showSearch']): ?>
            <button class="search-btn" aria-label="Buscar">
                <i class="fas fa-search"></i>
            </button>
            <?php endif; ?>
            
            <!-- Botón de tema -->
            <button class="theme-toggle" id="themeToggle" aria-label="Cambiar tema">
                <i class="fas fa-moon"></i>
                <i class="fas fa-sun"></i>
            </button>
        </div>
        
        <!-- Hora actual -->
        <div class="current-time">
            <i class="fas fa-clock time-icon"></i>
            <span id="currentDateTime">
                <?php echo date('d/m/Y H:i:s'); ?>
            </span>
        </div>
    </div>
</header>

<!-- CSS específico para el header admin -->
<style>
.admin-header {
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-color);
}

.admin-header .header-left h1 {
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.admin-header .header-title-icon {
    color: var(--primary-color);
    font-size: 1.2rem;
}

.user-info-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: rgba(68, 76, 165, 0.1);
    border-radius: 20px;
    color: var(--primary-color);
    font-size: 0.85rem;
    font-weight: 500;
}

.user-info-header i {
    font-size: 0.9rem;
}

.time-icon {
    margin-right: 0.5rem;
    color: var(--text-secondary);
    font-size: 0.9rem;
}
</style>

<!-- JavaScript para funcionalidades del header admin -->
<script>
// Funcionalidades específicas para el header de administrador
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Header admin inicializado');
    
    // ========================
    // 1. TOGGLE SIDEBAR
    // ========================
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            
            // Agregar overlay cuando sidebar está activo en móvil
            if (window.innerWidth <= 768) {
                if (sidebar.classList.contains('active')) {
                    createSidebarOverlay();
                } else {
                    removeSidebarOverlay();
                }
            }
        });
    }
    
    // Crear overlay para móvil
    function createSidebarOverlay() {
        if (document.querySelector('.sidebar-overlay')) return;
        
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 999;
            display: block;
        `;
        
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            removeSidebarOverlay();
        });
        
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
    }
    
    function removeSidebarOverlay() {
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) {
            overlay.remove();
        }
        document.body.style.overflow = '';
    }
    
    // ========================
    // 2. ACTUALIZAR HORA
    // ========================
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
    
    // Actualizar inmediatamente y cada segundo
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // ========================
    // 3. NOTIFICACIONES
    // ========================
    const notificationBtn = document.querySelector('.notification-btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            const badge = this.querySelector('.notification-badge');
            const count = parseInt(this.getAttribute('data-badge') || '0');
            
            if (badge && count > 0) {
                // Marcar como leídas
                badge.style.display = 'none';
                this.setAttribute('data-badge', '0');
                
                // Mostrar notificación
                showAdminNotification('Notificaciones marcadas como leídas', 'success');
            } else {
                showAdminNotification('No hay notificaciones nuevas', 'info');
            }
        });
    }
    
    // Función para mostrar notificaciones en admin
    function showAdminNotification(message, type = 'info') {
        // Verificar si ya hay una notificación activa
        const existingNotification = document.querySelector('.admin-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `admin-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 
                                  type === 'error' ? 'times-circle' : 
                                  type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Estilos dinámicos según tema
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${isDarkMode ? '#1f2937' : '#ffffff'};
            color: ${isDarkMode ? '#ffffff' : '#1f2937'};
            padding: 1rem 1.5rem;
            border-radius: 8px;
            border: 1px solid ${isDarkMode ? '#374151' : '#e5e7eb'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            animation: slideInRight 0.3s ease;
            max-width: 350px;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remover después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
        
        return notification;
    }
    
    // ========================
    // 4. BÚSQUEDA
    // ========================
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            // Crear o mostrar barra de búsqueda
            const existingSearchBar = document.querySelector('.search-bar-admin');
            
            if (existingSearchBar) {
                // Si ya existe, alternar visibilidad
                existingSearchBar.classList.toggle('active');
                
                // Si se activa, enfocar el input
                if (existingSearchBar.classList.contains('active')) {
                    const searchInput = existingSearchBar.querySelector('input');
                    if (searchInput) {
                        searchInput.focus();
                    }
                }
            } else {
                // Crear nueva barra de búsqueda
                createSearchBar();
            }
        });
    }
    
    function createSearchBar() {
        const searchBar = document.createElement('div');
        searchBar.className = 'search-bar-admin active';
        searchBar.innerHTML = `
            <div class="search-bar-container">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Buscar en el sistema..." 
                       aria-label="Buscar en el sistema">
                <button class="search-close" aria-label="Cerrar búsqueda">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        searchBar.style.cssText = `
            position: fixed;
            top: 70px;
            left: 0;
            right: 0;
            background: var(--bg-primary);
            padding: 1rem 2rem;
            border-bottom: 1px solid var(--border-color);
            z-index: 99;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transform: translateY(-100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(searchBar);
        
        // Animar entrada
        setTimeout(() => {
            searchBar.style.transform = 'translateY(0)';
        }, 10);
        
        // Configurar eventos
        const searchInput = searchBar.querySelector('input');
        const closeBtn = searchBar.querySelector('.search-close');
        
        if (searchInput) {
            searchInput.focus();
            
            searchInput.addEventListener('keyup', function(e) {
                if (e.key === 'Enter') {
                    performSearch(this.value);
                }
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                searchBar.style.transform = 'translateY(-100%)';
                setTimeout(() => {
                    if (searchBar.parentNode) {
                        searchBar.remove();
                    }
                }, 300);
            });
        }
        
        // Cerrar al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!searchBar.contains(e.target) && !searchBtn.contains(e.target)) {
                searchBar.style.transform = 'translateY(-100%)';
                setTimeout(() => {
                    if (searchBar.parentNode) {
                        searchBar.remove();
                    }
                }, 300);
            }
        });
    }
    
    function performSearch(query) {
        if (query.trim() === '') return;
        
        console.log('🔍 Buscando:', query);
        // Aquí implementarías la lógica de búsqueda real
        showAdminNotification(`Buscando: "${query}"`, 'info');
    }
    
    // ========================
    // 5. RESPONSIVE
    // ========================
    function handleResponsive() {
        const headerRight = document.querySelector('.header-right');
        const currentTime = document.querySelector('.current-time');
        
        if (!headerRight || !currentTime) return;
        
        if (window.innerWidth <= 768) {
            // En móvil, ocultar hora si está en el lugar incorrecto
            currentTime.classList.add('mobile-hidden');
            
            // Crear hora en menú hamburguesa si no existe
            if (!document.querySelector('.mobile-time')) {
                const mobileTime = document.createElement('div');
                mobileTime.className = 'mobile-time';
                mobileTime.innerHTML = `
                    <i class="fas fa-clock"></i>
                    <span id="mobileCurrentTime"></span>
                `;
                mobileTime.style.cssText = `
                    padding: 0.5rem 1rem;
                    background: var(--bg-tertiary);
                    border-radius: 20px;
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-left: auto;
                `;
                
                headerRight.insertBefore(mobileTime, headerRight.firstChild);
                
                // Actualizar también la hora móvil
                function updateMobileTime() {
                    const now = new Date();
                    const mobileElement = document.getElementById('mobileCurrentTime');
                    if (mobileElement) {
                        mobileElement.textContent = now.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    }
                }
                
                setInterval(updateMobileTime, 1000);
                updateMobileTime();
            }
        } else {
            // En desktop, restaurar
            currentTime.classList.remove('mobile-hidden');
            const mobileTime = document.querySelector('.mobile-time');
            if (mobileTime) {
                mobileTime.remove();
            }
        }
    }
    
    // Escuchar cambios de tamaño
    window.addEventListener('resize', handleResponsive);
    handleResponsive(); // Ejecutar al cargar
    
    // ========================
    // 6. ANIMACIONES CSS
    // ========================
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .mobile-hidden {
            display: none !important;
        }
        
        .search-bar-container {
            position: relative;
            max-width: 600px;
            margin: 0 auto;
        }
        
        .search-bar-container i.fa-search {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-secondary);
        }
        
        .search-bar-container input {
            width: 100%;
            padding: 0.75rem 1rem 0.75rem 3rem;
            border: 1px solid var(--border-color);
            border-radius: 25px;
            background: var(--bg-tertiary);
            color: var(--text-primary);
            font-size: 0.95rem;
        }
        
        .search-bar-container input:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 2px rgba(68, 76, 165, 0.1);
        }
        
        .search-close {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            font-size: 1rem;
        }
        
        .search-close:hover {
            color: var(--error-color);
        }
    `;
    document.head.appendChild(style);
    
    console.log('✅ Header admin completamente inicializado');
});
</script>