// dashboard-admin.js - Versión simplificada sin ThemeManager propio

// Variables globales para gráficos
let revenueChart, clientsChart, repuestosChart, averiasChart;

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Dashboard admin cargado - Versión simplificada');
    
    // ============================================
    // 1. FUNCIONES DE GRÁFICOS (sin cambios)
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
    // 2. OTRAS FUNCIONALIDADES
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
    
    // ============================================
    // 3. MANEJAR CAMBIOS DE TEMA
    // ============================================
    
    // Escuchar cambios de tema para actualizar gráficos
    document.addEventListener('themeChanged', function(e) {
        console.log('🎨 Tema cambiado en dashboard:', e.detail.theme);
        updateChartsForTheme();
    });
    
    // Verificar y aplicar tema actual a gráficos
    function applyCurrentThemeToCharts() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        console.log('🎨 Tema actual detectado:', currentTheme);
        updateChartsForTheme();
    }
    
    // ============================================
    // 4. INICIALIZACIÓN PRINCIPAL
    // ============================================
    
    function initDashboard() {
        console.log('🚀 Inicializando dashboard admin...');
        
        // 1. Inicializar gráficos con tema actual
        applyCurrentThemeToCharts();
        
        // 2. Otras funcionalidades
        updateDateTime();
        setInterval(updateDateTime, 1000);
        
        initSidebarToggle();
        initDynamicStats();
        
        // 3. Hacer funciones disponibles globalmente
        window.updateChartsForTheme = updateChartsForTheme;
        
        console.log('✅ Dashboard admin completamente inicializado');
    }
    
    // Iniciar todo
    initDashboard();
});