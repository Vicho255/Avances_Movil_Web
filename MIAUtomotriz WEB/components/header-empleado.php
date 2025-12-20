<header class="top-header empleado-header">
    <div class="header-left">
        <button class="menu-toggle">
            <i class="fas fa-bars"></i>
        </button>
        <h1>Mi Panel de Trabajo</h1>
    </div>
    <div class="header-right">
        <div class="shift-info">
            <i class="fas fa-clock"></i>
            <span>Turno: 08:00 - 17:00</span>
        </div>
        <div class="header-actions">
            <button class="notification-btn">
                <i class="fas fa-bell"></i>
                <span class="notification-badge">5</span>
            </button>
            <button class="break-btn" id="breakToggle">
                <i class="fas fa-coffee"></i>
                <span>En Turno</span>
            </button>
            <button class="theme-toggle" id="themeToggle">
                <i class="fas fa-moon"></i>
                <i class="fas fa-sun"></i>
            </button>
        </div>
        <div class="current-time">
            <span id="currentDateTime"><?php echo date('d/m/Y H:i:s'); ?></span>
        </div>
    </div>
</header>