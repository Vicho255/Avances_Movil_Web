<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Iniciar Sesión - MiAutomotriz</title>
    <link rel="stylesheet" href="/styles/estilos.css">
    <style>
        /* Estilos adicionales para PHP */
        .error-message {
            color: #dc3545;
            margin-top: 10px;
            padding: 10px;
            border-radius: 5px;
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            display: none;
        }
        
        .success-message {
            color: #28a745;
            margin-top: 10px;
            padding: 10px;
            border-radius: 5px;
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            display: none;
        }
    </style>
</head>
<body>

    <?php
    session_start();
    
    // Manejo del formulario de login
    $error = '';
    $success = '';
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Aquí puedes agregar la lógica de autenticación
        $username = $_POST['username'] ?? '';
        $password = $_POST['password'] ?? '';
        
        // Validación básica (reemplazar con tu lógica de autenticación real)
        if (empty($username) || empty($password)) {
            $error = 'Por favor, complete todos los campos';
        } else {
            // Ejemplo de autenticación - REEMPLAZAR CON TU LÓGICA
            $valid_users = [
                'admin' => 'admin123',
                'usuario' => 'clave123'
            ];
            
            if (isset($valid_users[$username]) && $valid_users[$username] === $password) {
                $_SESSION['usuario'] = $username;
                $_SESSION['autenticado'] = true;
                $success = 'Inicio de sesión exitoso. Redirigiendo...';
                
                // Redirección después de 2 segundos
                header("refresh:2;url=dashboardAdmin.php");
            } else {
                $error = 'Usuario o contraseña incorrectos';
            }
        }
    }
    
    // Verificar si ya está autenticado
    if (isset($_SESSION['autenticado']) && $_SESSION['autenticado'] === true) {
        header("Location: dashboardAdmin.php");
        exit();
    }
    ?>

    <div class="logo" id="logo" style="display: none;">
        <svg width="60" height="60" viewBox="0 0 24 24" fill="#007bff">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
        <h1>MiAutomotriz</h1>
    </div>

    <!-- Pantalla de bienvenida -->
    <button class="login-btn" id="showLoginBtn">
        <div class="logobtn">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="#10b981">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
            <h1>MiAutomotriz</h1>
        </div>
    </button>

    <div class="login-container" id="loginContainer">
        <h2>Iniciar Sesión</h2>
        
        <?php if ($error): ?>
            <div class="error-message" style="display: block;"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>
        
        <?php if ($success): ?>
            <div class="success-message" style="display: block;"><?php echo htmlspecialchars($success); ?></div>
        <?php endif; ?>
        
        <form id="loginForm" method="POST" action="">
            <label for="username">Usuario:</label>
            <input type="text" id="username" name="username" required placeholder="Ingresa tu usuario" value="<?php echo isset($_POST['username']) ? htmlspecialchars($_POST['username']) : ''; ?>">

            <label for="password">Contraseña:</label>
            <input type="password" id="password" name="password" required placeholder="Ingresa tu contraseña">

            <button type="submit" class="ingreso-button">Ingresar</button>
        </form>
        <div id="errorMessage" class="error-message"></div>
    </div>

    <!-- Enlace común -->
    <div class="common-link" id="btnCli">
        <a href="clientes.php">Ver clientes (acceso demo)</a>
    </div>

    <script src="/scripts/script.js"></script>
    <script>
        // Script para manejar mensajes de PHP
        document.addEventListener('DOMContentLoaded', function() {
            <?php if ($error): ?>
                setTimeout(function() {
                    document.querySelector('.error-message').style.display = 'none';
                }, 5000);
            <?php endif; ?>
            
            <?php if ($success): ?>
                setTimeout(function() {
                    document.querySelector('.success-message').style.display = 'none';
                }, 5000);
            <?php endif; ?>
        });
    </script>
</body>
</html>