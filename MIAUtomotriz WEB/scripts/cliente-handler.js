// scripts/cliente-handler.js
async function guardarCliente(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Validación básica
    const rut = formData.get('rut');
    if (!validarFormatoRUT(rut)) {
        mostrarNotificacion('Formato de RUT inválido. Use: 12345678-9', 'error');
        return false;
    }
    
    // Mostrar indicador de carga
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('gestion-clientes.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarNotificacion(data.message, 'success');
            form.reset();
            
            // Si necesitas actualizar la lista de clientes
            if (typeof actualizarListaClientes === 'function') {
                actualizarListaClientes();
            }
        } else {
            mostrarNotificacion(data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error de conexión', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
    
    return false;
}

function validarFormatoRUT(rut) {
    return /^[0-9]{7,8}-[0-9Kk]$/.test(rut);
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    // Remover notificaciones anteriores
    document.querySelectorAll('.notification').forEach(el => el.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${tipo}`;
    notification.textContent = mensaje;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    
    // Aplicar estilos según tema actual
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDarkMode && tipo === 'info') {
        notification.style.background = '#3b82f6';
    }
    
    document.body.appendChild(notification);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Agregar máscara para RUT
document.addEventListener('DOMContentLoaded', function() {
    const rutInput = document.getElementById('rut');
    if (rutInput) {
        rutInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^\dkK]/g, '');
            
            if (value.length > 8) {
                value = value.substring(0, 8) + '-' + value.substring(8, 9);
            } else if (value.length > 1) {
                value = value.substring(0, value.length - 1) + '-' + value.substring(value.length - 1);
            }
            
            e.target.value = value;
        });
    }
    
    // Función para limpiar formulario
    const btnLimpiar = document.getElementById('btnLimpiar');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', function() {
            document.getElementById('clienteForm').reset();
        });
    }
});