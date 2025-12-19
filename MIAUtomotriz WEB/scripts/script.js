// Solo animaciones, NO autenticación
document.addEventListener('DOMContentLoaded', function() {
    const showLoginButton = document.getElementById('showLoginBtn');
    const showLoginForm = document.getElementById('loginContainer');
    const btnCli = document.getElementById('btnCli');
    const Logo = document.getElementById('logo');
    
    if (showLoginButton) {
        showLoginButton.addEventListener('click', function() {
            showLoginButton.style.animation = 'fadeOutUp 0.5s ease forwards';
            
            setTimeout(() => {
                showLoginButton.style.display = 'none';
                
                if (Logo) {
                    Logo.style.display = 'flex';
                    Logo.style.animation = 'fadeInDown 0.5s ease forwards';
                }
                
                if (showLoginForm) {
                    showLoginForm.classList.add('active');
                    showLoginForm.style.display = 'block';
                }
                
                setTimeout(() => {
                    if (btnCli) btnCli.classList.add('show');
                }, 300);
            }, 500);
        });
    }
    
    // Si hay error, mostrar formulario automáticamente
    const errorMessage = document.querySelector('.error-message');
    if (errorMessage) {
        if (showLoginButton) showLoginButton.style.display = 'none';
        if (Logo) Logo.style.display = 'flex';
        if (showLoginForm) {
            showLoginForm.classList.add('active');
            showLoginForm.style.display = 'block';
        }
        if (btnCli) btnCli.classList.add('show');
    }
});