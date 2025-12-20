// theme-manager.js - Sistema de tema oscuro/claro unificado

class ThemeManager {
    constructor(options = {}) {
        this.options = {
            themeKey: 'miAutomotriz-theme',
            ...options
        };
        
        this.themeToggle = document.getElementById('themeToggle');
        this.currentTheme = null;
    }
    
    init() {
        if (!this.themeToggle) {
            console.warn('ThemeManager: Botón de tema no encontrado');
            return;
        }
        
        // Cargar tema inicial
        this.loadInitialTheme();
        
        // Vincular eventos
        this.bindEvents();
        
        console.log('✅ ThemeManager inicializado');
    }
    
    loadInitialTheme() {
        // 1. Verificar localStorage
        const savedTheme = localStorage.getItem(this.options.themeKey);
        
        // 2. Verificar preferencia del sistema
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // 3. Decidir tema inicial
        let theme = 'light'; // Default
        if (savedTheme) {
            theme = savedTheme;
        } else if (systemPrefersDark) {
            theme = 'dark';
        }
        
        // 4. Aplicar tema
        this.applyTheme(theme);
        this.currentTheme = theme;
        
        console.log(`🌓 Tema inicial: ${theme}`);
    }
    
    applyTheme(theme) {
        // Establecer atributo en HTML
        document.documentElement.setAttribute('data-theme', theme);
        
        // Guardar en localStorage
        localStorage.setItem(this.options.themeKey, theme);
        
        // Actualizar gráficos si existen
        if (typeof window.updateChartsForTheme === 'function') {
            window.updateChartsForTheme();
        }
        
        // Disparar evento personalizado
        const event = new CustomEvent('themeChanged', { detail: { theme } });
        document.dispatchEvent(event);
    }
    
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        
        console.log(`🔄 Cambiando tema: ${this.currentTheme} → ${newTheme}`);
        
        // Aplicar nuevo tema
        this.applyTheme(newTheme);
        this.currentTheme = newTheme;
        
        // Mostrar feedback visual
        this.showThemeNotification(newTheme);
        
        return newTheme;
    }
    
    showThemeNotification(theme) {
        const message = theme === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado';
        
        // Crear notificación
        const notification = document.createElement('div');
        notification.textContent = `🌓 ${message}`;
        notification.className = 'theme-notification';
        
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
            animation: themeFadeIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remover
        setTimeout(() => {
            notification.style.animation = 'themeFadeOut 0.3s ease';
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
            if (!localStorage.getItem(this.options.themeKey)) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
    
    // Métodos estáticos para fácil uso
    static init() {
        if (!window.themeManagerInstance) {
            window.themeManagerInstance = new ThemeManager();
            window.themeManagerInstance.init();
        }
        return window.themeManagerInstance;
    }
    
    static toggle() {
        if (window.themeManagerInstance) {
            return window.themeManagerInstance.toggleTheme();
        }
        return null;
    }
    
    static getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }
}

// Auto-inicializar si hay botón de tema
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('themeToggle')) {
        ThemeManager.init();
    }
});

// Exportar para uso global
window.ThemeManager = ThemeManager;