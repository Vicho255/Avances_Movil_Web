// dashboard-admin.js - VERSIÓN FINAL Y LIMPIA

// Variables globales para gráficos
let revenueChart, clientsChart, repuestosChart, averiasChart;

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Dashboard cargado - Inicializando...');
    
    // ============================================
    // 1. SISTEMA DE TEMA (VERSIÓN LIMPIA)
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
            
            // Cargar tema inicial
            this.loadInitialTheme();
            
            // Vincular eventos
            this.bindEvents();
            
            console.log('✅ Sistema de tema inicializado');
        }
        
        loadInitialTheme() {
            // Prioridad 1: localStorage
            const savedTheme = localStorage.getItem('miAutomotriz-tema');
            
            // Prioridad 2: Preferencia del sistema
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            // Decidir tema inicial
            let theme = 'light'; // Default
            if (savedTheme) {
                theme = savedTheme;
            } else if (systemPrefersDark) {
                theme = 'dark';
            }
            
            // Aplicar tema
            this.applyTheme(theme);
            console.log(`🌓 Tema inicial: ${theme}`);
        }
        
        applyTheme(theme) {
            // Establecer atributo en HTML
            document.documentElement.setAttribute('data-theme', theme);
            
            // Guardar en localStorage
            localStorage.setItem('miAutomotriz-tema', theme);
            
            // Actualizar gráficos si existen
            if (typeof updateChartsForTheme === 'function') {
                updateChartsForTheme();
            }
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
            // Notificación simple
            const notification = document.createElement('div');
            notification.textContent = `Modo ${theme === 'dark' ? 'oscuro' : 'claro'} activado`;
            notification.className = 'theme-notification';
            
            // Estilos inline para asegurar funcionamiento
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${theme === 'dark' ? '#1f2937' : '#ffffff'};
                color: ${theme === 'dark' ? '#ffffff' : '#1f2937'};
                padding: 12px 20px;
                border-radius: 8px;
                border: 2px solid ${theme === 'dark' ? '#6366f1' : '#444ca5'};
                z-index: 10000;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                animation: themeNotificationFade 0.3s ease;
            `;
            
            document.body.appendChild(notification);
            
            // Auto-remover
            setTimeout(() => {
                notification.style.animation = 'themeNotificationFadeOut 0.3s ease';
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
            
            // Escuchar cambios del sistema
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem('miAutomotriz-tema')) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }
    
    // ============================================
    // 2. FUNCIONES DE GRÁFICOS
    // ============================================
    
    function getThemeColors() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return {
            isDark: isDark,
            gridColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            textColor: isDark ? '#f3f4f6' : '#374151',
            bgColor: isDark ? '#1f2937' : '#ffffff',
            primaryColor: isDark ? '#6366f1' : '#444ca5',
            primaryLight: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(68, 76, 165, 0.1)'
        };
    }
    
    function initRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;
        
        const colors = getThemeColors();
        
        if (revenueChart) revenueChart.destroy();
        
        revenueChart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                datasets: [{
                    label: 'Ingresos ($)',
                    data: [35000, 42000, 38000, 45000, 41000, 45670, 48000, 50000, 52000, 60000, 58000, 62000],
                    borderColor: colors.primaryColor,
                    backgroundColor: colors.primaryLight,
                    borderWidth: 2,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: colors.gridColor },
                        ticks: { color: colors.textColor }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: colors.textColor }
                    }
                }
            }
        });
    }
    
    function initRevenueChartCLI() {
        const ctx = document.getElementById('revenueChartCLI');
        if (!ctx) return;
        
        const colors = getThemeColors();
        
        if (clientsChart) clientsChart.destroy();
        
        clientsChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Clientes Nuevos',
                    data: [5, 10, 13, 7, 16, 8, 17],
                    borderColor: colors.primaryColor,
                    backgroundColor: colors.primaryLight,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: colors.gridColor },
                        ticks: { color: colors.textColor }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: colors.textColor }
                    }
                }
            }
        });
    }
    
    function initRevenueChartERep() {
        const ctx = document.getElementById('revenueChartRep');
        if (!ctx) return;
        
        const colors = getThemeColors();
        
        if (repuestosChart) repuestosChart.destroy();
        
        repuestosChart = new Chart(ctx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['Neumático', 'Batería', 'Filtro Aceite', 'Pastillas Freno', 'Aceite Motor', 'Otros'],
                datasets: [{
                    data: [40, 25, 15, 10, 5, 5],
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#4BC0C0', 
                        '#FFCE56', '#9966FF', '#FF9F40'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: colors.textColor }
                    }
                }
            }
        });
    }
    
    function initRevenueChartEFall() {
        const ctx = document.getElementById('revenueChartFall');
        if (!ctx) return;
        
        const colors = getThemeColors();
        
        if (averiasChart) averiasChart.destroy();
        
        averiasChart = new Chart(ctx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['Batería', 'Frenos', 'Llanta', 'Vidrio', 'Motor', 'Otros'],
                datasets: [{
                    data: [30, 25, 20, 15, 5, 5],
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#4BC0C0', 
                        '#FFCE56', '#9966FF', '#FF9F40'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: colors.textColor }
                    }
                }
            }
        });
    }
    
    // Función para actualizar gráficos cuando cambia el tema
    function updateChartsForTheme() {
        console.log('🔄 Actualizando gráficos para el nuevo tema...');
        initRevenueChart();
        initRevenueChartCLI();
        initRevenueChartERep();
        initRevenueChartEFall();
    }
    
    // ============================================
    // 3. OTRAS FUNCIONALIDADES
    // ============================================
    
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
    
    function initDynamicStats() {
        setTimeout(() => {
            const stats = {
                clientes: '1,248',
                vehiculos: '856',
                servicios: '324',
                ingresos: '$45,670'
            };
            
            const updateElement = (id, value) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            };
            
            updateElement('totalClientes', stats.clientes);
            updateElement('totalVehiculos', stats.vehiculos);
            updateElement('totalServicios', stats.servicios);
            updateElement('totalIngresos', stats.ingresos);
        }, 1000);
    }
    
    function addAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes themeNotificationFade {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes themeNotificationFadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // ============================================
    // 4. INICIALIZACIÓN PRINCIPAL
    // ============================================
    
    function initDashboard() {
        console.log('🚀 Inicializando dashboard...');
        
        // Agregar animaciones CSS
        addAnimations();
        
        // 1. Inicializar sistema de tema (IMPORTANTE: Primero)
        const themeManager = new ThemeManager();
        
        // 2. Inicializar gráficos
        initRevenueChart();
        initRevenueChartCLI();
        initRevenueChartERep();
        initRevenueChartEFall();
        
        // 3. Otras funcionalidades
        updateDateTime();
        setInterval(updateDateTime, 1000);
        
        initSidebarToggle();
        initDynamicStats();
        
        // 4. Hacer funciones disponibles globalmente si es necesario
        window.updateChartsForTheme = updateChartsForTheme;
        window.themeManager = themeManager;
        
        console.log('✅ Dashboard completamente inicializado');
    }
    
    // Iniciar todo
    initDashboard();
});