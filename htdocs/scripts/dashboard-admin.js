// dashboard-admin.js

document.addEventListener('DOMContentLoaded', function() {
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
    }

    // Inicializar gráfico de ingresos
    function initRevenueChart() {
        const ctx = document.getElementById('revenueChart').getContext('2d');
        const revenueChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                datasets: [{
                    label: 'Ingresos ($)',
                    data: [35000, 42000, 38000, 45000, 41000, 45670, 48000, 50000, 52000, 60000, 58000, 62000],
                    borderColor: '#444ca5',
                    backgroundColor: 'rgba(68, 76, 165, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
        
        return revenueChart;
    }

    // Inicializar gráfico de clientes - CORREGIDO
    function initRevenueChartCLI() {
        const ctx = document.getElementById('revenueChartCLI').getContext('2d');
        const revenueChartCLI = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'],
                datasets: [{
                    label: 'Clientes Nuevos',
                    data: [5, 10, 13, 7, 16, 8, 17],
                    backgroundColor: 'rgba(68, 76, 165, 0.1)',
                    borderColor: '#444ca5',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#444ca5',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    } // ← Error corregido: coma sobrante eliminada
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value;
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
        
        return revenueChartCLI;
    }

// Inicializar gráfico de Repuestos mas Usados
    function initRevenueChartERep() {
        const ctx = document.getElementById('revenueChartRep').getContext('2d');
        const revenueChartRep = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Neumático', 'Batería', 'Filtro de Aceite', 'Pastillas de Freno', 'Aceite Motor', 'Otros'],
                datasets: [{
                    label: 'Repuestos Más Usados',
                    data: [40, 25, 15, 10, 5, 5],
                    backgroundColor: [
                        '#FF6384',  // Rojo
                        '#36A2EB',  // Azul
                        '#4BC0C0',  // Verde azulado
                        '#FFCE56',  // Amarillo
                        '#9966FF',  // Morado
                        '#FF9F40'   // Naranja
                    ],
                    borderColor: '#242424',
                    borderWidth: 2,
                    hoverBorderWidth: 3,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Repuestos Más Usados',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: 20
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value}% (${percentage}% del total)`;
                            }
                        }
                    }
                },
                // Animaciones
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
        
        return revenueChartRep;
    }

    // Inicializar gráfico de Averias Mas Comunes
    function initRevenueChartEFall() {
        const ctx = document.getElementById('revenueChartFall').getContext('2d');
        const revenueChartFall = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Bateris Descargada', 'Frenos Desgastados', 'Llanta Pinchada', 'Vidrio Roto', '', 'Otros'],
                datasets: [{
                    label: 'Averias Más Comunes',
                    data: [30, 25, 20, 15, 5, 5],
                    backgroundColor: [
                        '#FF6384',  // Rojo
                        '#36A2EB',  // Azul
                        '#4BC0C0',  // Verde azulado
                        '#FFCE56',  // Amarillo
                        '#9966FF',  // Morado
                        '#FF9F40'   // Naranja
                    ],
                    borderColor: '#242424',
                    borderWidth: 2,
                    hoverBorderWidth: 3,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Averias Más Comunes',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: 20
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value}% (${percentage}% del total)`;
                            }
                        }
                    }
                },
                // Animaciones
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
        
        return revenueChartFall;
    }

    
    // Toggle sidebar en móvil
    function initSidebarToggle() {
        const menuToggle = document.querySelector('.menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });

        // Cerrar sidebar al hacer clic fuera en móvil
        document.addEventListener('click', function(event) {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }

    // Efectos hover para tarjetas de estadísticas
    function initCardHoverEffects() {
        const statCards = document.querySelectorAll('.stat-card');
        const actionButtons = document.querySelectorAll('.action-btn');
        
        statCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });

        actionButtons.forEach(button => {
            button.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
            });
            
            button.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    }

    // Simular notificaciones
    function initNotifications() {
        const notificationBtn = document.querySelector('.notification-btn');
        const notificationBadge = document.querySelector('.notification-badge');
        
        notificationBtn.addEventListener('click', function() {
            // Simular marcar notificaciones como leídas
            notificationBadge.style.display = 'none';
            
            // Aquí iría la lógica para mostrar el panel de notificaciones
            alert('Panel de notificaciones - Funcionalidad en desarrollo');
        });
    }

    // Inicializar todas las funciones
    function initDashboard() {
        updateDateTime();
        setInterval(updateDateTime, 1000);
        initRevenueChart();
        initRevenueChartCLI();
        initRevenueChartERep();
        initRevenueChartEFall();
        initSidebarToggle();
        initCardHoverEffects();
        initNotifications();
        
        // Añadir efecto de carga suave
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.3s ease';
        
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 100);
    }

    // Iniciar el dashboard
    initDashboard();
});