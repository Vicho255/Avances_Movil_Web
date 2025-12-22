// dashboard-admin.js - Versión con manejo mejorado de errores

// Variables globales para gráficos
let revenueChart, clientsChart, repuestosChart, averiasChart;

// Función para formatear números
function formatNumber(num) {
    return num.toLocaleString('es-CL');
}

// Función para formatear moneda
function formatCurrency(num) {
    return '$' + num.toLocaleString('es-CL');
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Dashboard admin cargado - Versión con datos reales');
    
    // ============================================
    // 1. FUNCIONES DE GRÁFICOS
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
    
    async function fetchData(endpoint) {
        try {
            const response = await fetch(endpoint);
            
            // Verificar si la respuesta es válida
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('La respuesta no es JSON');
            }
            
            const data = await response.json();
            
            // Verificar si hay error en los datos
            if (data.error) {
                console.error(`Error del servidor: ${data.error}`);
                return null;
            }
            
            return data;
        } catch (error) {
            console.error(`Error en fetch: ${error.message}`);
            return null;
        }
    }
    
    async function initRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;
        
        const data = await fetchData('api/dashboard-data.php?tipo=ingresos_mensuales');
        const colors = getThemeColors();
        
        if (revenueChart) revenueChart.destroy();
        
        // Usar datos de la API o valores predeterminados
        const chartData = data || {
            etiquetas: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            datos: [35000, 42000, 38000, 45000, 41000, 45670, 48000, 50000, 52000, 60000, 58000, 62000]
        };
        
        revenueChart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: chartData.etiquetas,
                datasets: [{
                    label: 'Ingresos ($)',
                    data: chartData.datos,
                    borderColor: colors.primaryColor,
                    backgroundColor: colors.primaryLight,
                    borderWidth: 2,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: colors.gridColor },
                        ticks: { 
                            color: colors.textColor,
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: colors.textColor }
                    }
                }
            }
        });
    }
    
    async function initRevenueChartCLI() {
        const ctx = document.getElementById('revenueChartCLI');
        if (!ctx) return;
        
        const data = await fetchData('api/dashboard-data.php?tipo=clientes_nuevos');
        const colors = getThemeColors();
        
        if (clientsChart) clientsChart.destroy();
        
        // Usar datos de la API o valores predeterminados
        const chartData = data || {
            etiquetas: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datos: [5, 10, 13, 7, 16, 8, 17]
        };
        
        clientsChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: chartData.etiquetas,
                datasets: [{
                    label: 'Clientes Nuevos',
                    data: chartData.datos,
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
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y} clientes`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: colors.gridColor },
                        ticks: { 
                            color: colors.textColor,
                            precision: 0
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: colors.textColor }
                    }
                }
            }
        });
    }
    
    async function initRevenueChartERep() {
        const ctx = document.getElementById('revenueChartRep');
        if (!ctx) return;
        
        const data = await fetchData('api/dashboard-data.php?tipo=repuestos_mas_usados');
        const colors = getThemeColors();
        
        if (repuestosChart) repuestosChart.destroy();
        
        // Usar datos de la API o valores predeterminados
        const chartData = data || {
            etiquetas: ['Neumático', 'Batería', 'Filtro Aceite', 'Pastillas Freno', 'Aceite Motor', 'Otros'],
            datos: [40, 25, 15, 10, 5, 5],
            colores: ['#FF6384', '#36A2EB', '#4BC0C0', '#FFCE56', '#9966FF', '#FF9F40']
        };
        
        repuestosChart = new Chart(ctx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: chartData.etiquetas,
                datasets: [{
                    data: chartData.datos,
                    backgroundColor: chartData.colores,
                    borderWidth: 1,
                    borderColor: colors.isDark ? '#374151' : '#e5e7eb'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { 
                            color: colors.textColor,
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} unidades (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    async function initRevenueChartEFall() {
        const ctx = document.getElementById('revenueChartFall');
        if (!ctx) return;
        
        const data = await fetchData('api/dashboard-data.php?tipo=averias_mas_comunes');
        const colors = getThemeColors();
        
        if (averiasChart) averiasChart.destroy();
        
        // Usar datos de la API o valores predeterminados
        const chartData = data || {
            etiquetas: ['Batería', 'Frenos', 'Llanta', 'Vidrio', 'Motor', 'Otros'],
            datos: [30, 25, 20, 15, 5, 5],
            colores: ['#FF6384', '#36A2EB', '#4BC0C0', '#FFCE56', '#9966FF', '#FF9F40']
        };
        
        averiasChart = new Chart(ctx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: chartData.etiquetas,
                datasets: [{
                    data: chartData.datos,
                    backgroundColor: chartData.colores,
                    borderWidth: 1,
                    borderColor: colors.isDark ? '#374151' : '#e5e7eb'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { 
                            color: colors.textColor,
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} casos (${percentage}%)`;
                            }
                        }
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
    
    async function initDynamicStats() {
        const data = await fetchData('api/dashboard-data.php?tipo=estadisticas_generales');
        
        // Usar datos de la API o valores predeterminados
        const stats = data || {
            clientes: 1248,
            vehiculos: 856,
            servicios_hoy: 324,
            ingresos_mes: 45670
        };
        
        const updateElement = (id, value, isCurrency = false) => {
            const element = document.getElementById(id);
            if (element) {
                if (isCurrency) {
                    element.textContent = formatCurrency(value);
                } else {
                    element.textContent = formatNumber(value);
                }
            }
        };
        
        updateElement('totalClientes', stats.clientes);
        updateElement('totalVehiculos', stats.vehiculos);
        updateElement('totalServicios', stats.servicios_hoy);
        updateElement('totalIngresos', stats.ingresos_mes, true);
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
    
    async function initDashboard() {
        console.log('🚀 Inicializando dashboard admin...');
        
        // Mostrar indicador de carga
        showLoadingIndicators();
        
        // 1. Otras funcionalidades
        updateDateTime();
        setInterval(updateDateTime, 1000);
        
        initSidebarToggle();
        
        // 2. Cargar estadísticas y gráficos
        await initDynamicStats();
        await applyCurrentThemeToCharts();
        
        // 3. Ocultar indicador de carga
        hideLoadingIndicators();
        
        // 4. Hacer funciones disponibles globalmente
        window.updateChartsForTheme = updateChartsForTheme;
        
        // 5. Configurar filtros de gráficos
        setupChartFilters();
        
        console.log('✅ Dashboard admin completamente inicializado');
    }
    
    // Mostrar indicadores de carga
    function showLoadingIndicators() {
        const statCards = document.querySelectorAll('.stat-card h3');
        statCards.forEach(card => {
            if (card.textContent === 'Cargando...') {
                card.innerHTML = '<span class="loading-dots"><span>.</span><span>.</span><span>.</span></span>';
            }
        });
    }
    
    // Ocultar indicadores de carga
    function hideLoadingIndicators() {
        const loadingDots = document.querySelectorAll('.loading-dots');
        loadingDots.forEach(dot => dot.remove());
    }
    
    // Configurar filtros de gráficos
    function setupChartFilters() {
        const filters = document.querySelectorAll('.chart-filter');
        filters.forEach(filter => {
            filter.addEventListener('change', function() {
                const chartType = this.closest('.chart-card, .client-card').querySelector('h3').textContent;
                console.log(`Filtro cambiado para: ${chartType} - Valor: ${this.value}`);
                // Aquí puedes implementar la lógica para recargar datos según el filtro
            });
        });
    }
    
    // Iniciar todo
    initDashboard();
});