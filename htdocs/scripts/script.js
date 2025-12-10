let activeForm = null;

// Base de datos simulada de usuarios
const usuarios = {
    admin: [
        {
            username: "admin",
            password: "admin123",
            nombre: "Administrador Principal"
        },
        {
            username: "supervisor",
            password: "sup2024",
            nombre: "Supervisor General"
        }
    ],
    empleado: [
        {
            username: "juan.perez",
            password: "empleado123",
            nombre: "Juan Pérez"
        },
        {
            username: "maria.garcia",
            password: "empleado456",
            nombre: "María García"
        },
        {
            username: "carlos.lopez",
            password: "empleado789",
            nombre: "Carlos López"
        },
        {
            username: "ana.martinez",
            password: "empleado000",
            nombre: "Ana Martínez"
        }
    ]
};

const showLoginButton = document.getElementById('showLoginBtn');
const showLoginForm = document.getElementById('loginContainer');
const btnCli = document.getElementById('btnCli');
const Logo = document.getElementById('logo');
// Inputs del formulario
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

// Deshabilitar inputs por defecto hasta que se muestre el formulario
if (usernameInput) usernameInput.disabled = true;
if (passwordInput) passwordInput.disabled = true;
showLoginButton.addEventListener('click', function() {
    // Animación de salida del botón
    showLoginButton.style.animation = 'fadeOutUp 0.5s ease forwards';
    
    setTimeout(() => {
        showLoginButton.style.display = 'none';

        Logo.style.display = 'flex';
        Logo.style.animation = 'fadeInDown 0.5s ease forwards';
        
        // Mostrar formulario con animación
        showLoginForm.classList.add('active');
        // Habilitar inputs cuando se muestre el formulario
        if (usernameInput) usernameInput.disabled = false;
        if (passwordInput) passwordInput.disabled = false;
        if (usernameInput) usernameInput.focus();
        
        // Mostrar enlace con animación retardada
        setTimeout(() => {
            btnCli.classList.add('show');
        }, 300);
        
        activeForm = 'login';
    }, 500);
});

// Función para verificar credenciales
function verificarCredenciales(username, password) {
    // Buscar en administradores
    for (let admin of usuarios.admin) {
        if (admin.username === username && admin.password === password) {
            return { 
                valido: true, 
                tipo: "admin", 
                nombre: admin.nombre 
            };
        }
    }
    
    // Buscar en empleados
    for (let empleado of usuarios.empleado) {
        if (empleado.username === username && empleado.password === password) {
            return { 
                valido: true, 
                tipo: "empleado", 
                nombre: empleado.nombre 
            };
        }
    }
    
    // Si no se encuentra
    return { valido: false };
}

// Manejar el envío del formulario
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    // Limpiar mensajes de error previos
    errorMessage.textContent = '';
    errorMessage.classList.remove('show');
    
    // Verificar credenciales
    const resultado = verificarCredenciales(username, password);
    
    if (resultado.valido) {
        // Animación de éxito antes de redirigir
        showLoginForm.style.transform = 'scale(1.05)';
        showLoginForm.style.boxShadow = '0 15px 40px rgba(16, 185, 129, 0.4)';
        
        setTimeout(() => {
            // Guardar información del usuario en sessionStorage
            sessionStorage.setItem('usuarioAutenticado', JSON.stringify({
                username: username,
                nombre: resultado.nombre,
                tipo: resultado.tipo
            }));
            
            // Redirigir según el tipo de usuario
            if (resultado.tipo === 'admin') {
                window.location.href = 'dashboardAdmin.php';
            } else {
                window.location.href = 'dashboardEmpleado.html';
            }
        }, 600);
        
    } else {
        // Mostrar mensaje de error con animación
        errorMessage.textContent = 'Usuario o contraseña incorrectos. Intente nuevamente.';
        errorMessage.classList.add('show');
        
        // Agregar efecto de shake al formulario
        showLoginForm.style.animation = 'none';
        setTimeout(() => {
            showLoginForm.style.animation = 'shake 0.5s ease-in-out';
        }, 10);
        
        // Resetear la animación después de que termine
        setTimeout(() => {
            showLoginForm.style.animation = '';
        }, 500);
    }
});