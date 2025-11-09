let activeForm = null;

// Base de datos simulada de usuarios
const usuarios = {
    admin: [
        {
            username: "admin",
            password: "admin123",
            securityCode: "123456",
            nombre: "Administrador Principal"
        },
        {
            username: "supervisor",
            password: "sup2024",
            securityCode: "654321",
            nombre: "Supervisor General"
        }
    ],
    empleado: [
        {
            username: "juan.perez",
            password: "empleado123",
            department: "ventas",
            nombre: "Juan Pérez"
        },
        {
            username: "maria.garcia",
            password: "empleado456",
            department: "taller",
            nombre: "María García"
        },
        {
            username: "carlos.lopez",
            password: "empleado789",
            department: "administracion",
            nombre: "Carlos López"
        },
        {
            username: "ana.martinez",
            password: "empleado000",
            department: "recepcion",
            nombre: "Ana Martínez"
        }
    ]
};

function toggleForm(formType) {
    const container = document.getElementById(`${formType}-container`);
    const otherFormType = formType === 'admin' ? 'empleado' : 'admin';
    const otherContainer = document.getElementById(`${otherFormType}-container`);
    
    // Si ya está expandido, contraerlo
    if (container.classList.contains('expanded')) {
        container.classList.remove('expanded');
        container.classList.add('collapsed');
        activeForm = null;
        return;
    }
    
    // Contraer el otro formulario si está expandido
    if (activeForm && activeForm !== formType) {
        otherContainer.classList.remove('expanded');
        otherContainer.classList.add('collapsed');
    }
    
    // Expandir el formulario seleccionado
    container.classList.remove('collapsed');
    container.classList.add('expanded');
    activeForm = formType;
}

// Cerrar formulario al hacer clic fuera (opcional)
document.addEventListener('click', function(event) {
    const forms = document.querySelectorAll('.form-container');
    let clickedInside = false;
    
    forms.forEach(form => {
        if (form.contains(event.target)) {
            clickedInside = true;
        }
    });
    
    if (!clickedInside && activeForm) {
        const activeContainer = document.getElementById(`${activeForm}-container`);
        activeContainer.classList.remove('expanded');
        activeContainer.classList.add('collapsed');
        activeForm = null;
    }
});

// Función para verificar credenciales de administrador
function verificarAdmin(username, password, securityCode) {
    if (!username || !password) {
        return { 
            success: false, 
            message: "Usuario y contraseña son obligatorios" 
        };
    }
    
    if (!securityCode || securityCode.length !== 6) {
        return { 
            success: false, 
            message: "El código de seguridad debe tener 6 dígitos" 
        };
    }
    
    const usuario = usuarios.admin.find(user => 
        user.username === username && 
        user.password === password && 
        user.securityCode === securityCode
    );
    
    if (usuario) {
        return { 
            success: true, 
            message: `Bienvenido ${usuario.nombre}`,
            usuario: usuario
        };
    } else {
        return { 
            success: false, 
            message: "Credenciales incorrectas. Verifique usuario, contraseña y código de seguridad." 
        };
    }
}

// Función para verificar credenciales de empleado
function verificarEmpleado(username, password, department) {
    if (!username || !password) {
        return { 
            success: false, 
            message: "Usuario y contraseña son obligatorios" 
        };
    }
    
    if (!department) {
        return { 
            success: false, 
            message: "Debe seleccionar un departamento" 
        };
    }
    
    const usuario = usuarios.empleado.find(user => 
        user.username === username && 
        user.password === password && 
        user.department === department
    );
    
    if (usuario) {
        return { 
            success: true, 
            message: `Bienvenido/a ${usuario.nombre}`,
            usuario: usuario
        };
    } else {
        return { 
            success: false, 
            message: "Credenciales incorrectas o departamento no coincide" 
        };
    }
}

// Función para mostrar mensajes de error/éxito
function mostrarMensaje(form, mensaje, esError = true) {
    // Remover mensajes anteriores
    const mensajeAnterior = form.querySelector('.mensaje-login');
    if (mensajeAnterior) {
        mensajeAnterior.remove();
    }
    
    // Crear nuevo mensaje
    const divMensaje = document.createElement('div');
    divMensaje.className = `mensaje-login ${esError ? 'error' : 'exito'}`;
    divMensaje.textContent = mensaje;
    
    // Insertar antes del botón de submit
    const submitBtn = form.querySelector('.submit-btn');
    form.querySelector('.form-content').insertBefore(divMensaje, submitBtn);
    
    // Auto-remover mensajes de éxito después de 3 segundos
    if (!esError) {
        setTimeout(() => {
            divMensaje.remove();
        }, 3000);
    }
}

// Función para manejar el envío del formulario de administrador
function manejarLoginAdmin(event) {
    event.preventDefault();
    
    const form = event.target;
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-password').value;
    const securityCode = document.getElementById('admin-code').value.trim();
    
    const resultado = verificarAdmin(username, password, securityCode);
    
    if (resultado.success) {
        mostrarMensaje(form, resultado.message, false);
        
        // Guardar datos de sesión si está marcado "Mantener sesión"
        const remember = form.querySelector('input[name="remember"]').checked;
        if (remember) {
            localStorage.setItem('adminSession', JSON.stringify({
                usuario: resultado.usuario,
                timestamp: new Date().getTime()
            }));
        } else {
            sessionStorage.setItem('adminSession', JSON.stringify({
                usuario: resultado.usuario,
                timestamp: new Date().getTime()
            }));
        }
        
        // Redirigir después de un breve delay
        setTimeout(() => {
            window.location.href = form.getAttribute('action');
        }, 1000);
    } else {
        mostrarMensaje(form, resultado.message, true);
    }
}

// Función para manejar el envío del formulario de empleado
function manejarLoginEmpleado(event) {
    event.preventDefault();
    
    const form = event.target;
    const username = document.getElementById('empleado-username').value.trim();
    const password = document.getElementById('empleado-password').value;
    const department = document.getElementById('empleado-department').value;
    
    const resultado = verificarEmpleado(username, password, department);
    
    if (resultado.success) {
        mostrarMensaje(form, resultado.message, false);
        
        // Guardar datos de sesión si está marcado "Recordar usuario"
        const remember = form.querySelector('input[name="remember"]').checked;
        if (remember) {
            localStorage.setItem('empleadoSession', JSON.stringify({
                usuario: resultado.usuario,
                timestamp: new Date().getTime()
            }));
        } else {
            sessionStorage.setItem('empleadoSession', JSON.stringify({
                usuario: resultado.usuario,
                timestamp: new Date().getTime()
            }));
        }
        
        // Redirigir después de un breve delay
        setTimeout(() => {
            window.location.href = form.getAttribute('action');
        }, 1000);
    } else {
        mostrarMensaje(form, resultado.message, true);
    }
}

// Función para cargar datos guardados (si existen)
function cargarDatosGuardados() {
    // Verificar si hay sesión de admin guardada
    const adminSession = localStorage.getItem('adminSession') || sessionStorage.getItem('adminSession');
    if (adminSession) {
        const sessionData = JSON.parse(adminSession);
        document.getElementById('admin-username').value = sessionData.usuario.username;
        document.querySelector('#admin-form input[name="remember"]').checked = true;
    }
    
    // Verificar si hay sesión de empleado guardada
    const empleadoSession = localStorage.getItem('empleadoSession') || sessionStorage.getItem('empleadoSession');
    if (empleadoSession) {
        const sessionData = JSON.parse(empleadoSession);
        document.getElementById('empleado-username').value = sessionData.usuario.username;
        document.querySelector('#empleado-form input[name="remember"]').checked = true;
    }
}

// Inicialización cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Reemplazar los event listeners existentes
    document.getElementById('admin-form').addEventListener('submit', manejarLoginAdmin);
    document.getElementById('empleado-form').addEventListener('submit', manejarLoginEmpleado);
    
    // Cargar datos guardados
    cargarDatosGuardados();
    
    // Validación en tiempo real para el código de seguridad (solo números)
    const adminCodeInput = document.getElementById('admin-code');
    if (adminCodeInput) {
        adminCodeInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 6);
        });
    }
    
    // Remover el event listener genérico anterior
    document.querySelectorAll('form').forEach(form => {
        form.removeEventListener('submit', function(e) {
            e.preventDefault();
            const formType = this.id.replace('-form', '');
            const username = this.querySelector('input[type="text"]').value;
            alert(`Inicio de sesión exitoso como ${formType}\nUsuario: ${username}`);
        });
    });
});