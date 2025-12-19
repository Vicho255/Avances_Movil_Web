<?php
ob_start(); // Iniciar buffer de salida
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Debug: crear archivo de log
$debug_log = "login_debug_" . date('Ymd') . ".txt";
file_put_contents($debug_log, "[" . date('H:i:s') . "] Script iniciado\n", FILE_APPEND);

require_once 'config/database.php';

// Si ya está autenticado, redirigir
if(isset($_SESSION['autenticado']) && $_SESSION['autenticado'] === TRUE){
    file_put_contents($debug_log, "[" . date('H:i:s') . "] Ya autenticado\n", FILE_APPEND);
    $tipo = $_SESSION['tipo_persona'] ?? '';
    file_put_contents($debug_log, "[" . date('H:i:s') . "] Tipo: $tipo\n", FILE_APPEND);
    
    if($tipo === 'Administrador'){
        file_put_contents($debug_log, "[" . date('H:i:s') . "] Redirigiendo a admin_dashboard.php\n", FILE_APPEND);
        header('Location: admin_dashboard.php');
        exit();
    } elseif($tipo === 'Empleado'){
        file_put_contents($debug_log, "[" . date('H:i:s') . "] Redirigiendo a empleado_dashboard.php\n", FILE_APPEND);
        header('Location: empleado_dashboard.php');
        exit();
    }
}

$error_1 = '';

// Solo si es POST procesamos el login
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    file_put_contents($debug_log, "[" . date('H:i:s') . "] POST recibido\n", FILE_APPEND);
    file_put_contents($debug_log, "[" . date('H:i:s') . "] POST data: " . print_r($_POST, true) . "\n", FILE_APPEND);
    
    $database = new Database();
    $conn = $database->getConnection();
    
    if (!$conn) {
        $error_1 = "Error de conexión a la base de datos.";
        file_put_contents($debug_log, "[" . date('H:i:s') . "] Error de conexión BD\n", FILE_APPEND);
    } else {
        $usuario = trim($_POST['username'] ?? '');
        $contrasena = trim($_POST['password'] ?? '');
        
        file_put_contents($debug_log, "[" . date('H:i:s') . "] Usuario: $usuario, Contraseña: $contrasena\n", FILE_APPEND);
        
        if (empty($usuario) || empty($contrasena)) {
            $error_1 = "Por favor complete todos los campos";
            file_put_contents($debug_log, "[" . date('H:i:s') . "] Campos vacíos\n", FILE_APPEND);
        } else {
            try {
                // Usar la función PostgreSQL
                $query = "SELECT * FROM validacion_credenciales(:usuario, :contrasena)";
                file_put_contents($debug_log, "[" . date('H:i:s') . "] Query: $query\n", FILE_APPEND);
                
                $stmt = $conn->prepare($query);
                $stmt->bindParam(':usuario', $usuario);
                $stmt->bindParam(':contrasena', $contrasena);
                $stmt->execute();
                
                $rowCount = $stmt->rowCount();
                file_put_contents($debug_log, "[" . date('H:i:s') . "] Filas encontradas: $rowCount\n", FILE_APPEND);
                
                if ($rowCount == 1) {
                    $row = $stmt->fetch(PDO::FETCH_ASSOC);
                    file_put_contents($debug_log, "[" . date('H:i:s') . "] Datos usuario: " . print_r($row, true) . "\n", FILE_APPEND);
                    
                    // Configurar sesión
                    $_SESSION['autenticado'] = TRUE;
                    $_SESSION['usuario'] = $row['nombre'];
                    $_SESSION['tipo_persona'] = $row['tipo_persona'];
                    $_SESSION['rut'] = $row['rut'];
                    
                    file_put_contents($debug_log, "[" . date('H:i:s') . "] Sesión configurada\n", FILE_APPEND);
                    
                    // Redirigir según tipo
                    if ($row['tipo_persona'] === 'Administrador') {
                        file_put_contents($debug_log, "[" . date('H:i:s') . "] Redirigiendo ADMIN\n", FILE_APPEND);
                        header('Location: admin_dashboard.php');
                        exit();
                    } elseif ($row['tipo_persona'] === 'Empleado') {
                        file_put_contents($debug_log, "[" . date('H:i:s') . "] Redirigiendo EMPLEADO\n", FILE_APPEND);
                        header('Location: empleado_dashboard.php');
                        exit();
                    } else {
                        session_destroy();
                        $error_1 = "Acceso no autorizado.";
                        file_put_contents($debug_log, "[" . date('H:i:s') . "] Tipo no autorizado\n", FILE_APPEND);
                    }
                    
                } else {
                    $error_1 = "Usuario o contraseña incorrectos.";
                    file_put_contents($debug_log, "[" . date('H:i:s') . "] Credenciales incorrectas\n", FILE_APPEND);
                }
                
            } catch (PDOException $e) {
                $error_msg = $e->getMessage();
                error_log("Error en login: " . $error_msg);
                $error_1 = "Error en el sistema. Por favor, intente más tarde.";
                file_put_contents($debug_log, "[" . date('H:i:s') . "] Error PDO: $error_msg\n", FILE_APPEND);
            }
        }
    }
} else {
    file_put_contents($debug_log, "[" . date('H:i:s') . "] No es POST\n", FILE_APPEND);
}
ob_end_flush(); // Enviar buffer
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Iniciar Sesión - MiAutomotriz</title>
    <link rel="stylesheet" href="styles/estilos.css">
    <style>
        .error-message {
            color: #dc3545;
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
        }
        .debug-info {
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: #f8f9fa;
            padding: 10px;
            border: 1px solid #dee2e6;
            font-size: 12px;
            border-radius: 5px;
            display: none; /* Oculta en producción */
        }
    </style>
</head>
<body>

    <div class="logo" id="logo" style="display: none;">
        <svg width="60" height="60" viewBox="0 0 24 24" fill="#007bff">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
        <h1>MiAutomotriz</h1>
    </div>

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
        
        <?php if (!empty($error_1)): ?>
            <div class="error-message">
                <?php echo htmlspecialchars($error_1); ?>
            </div>
        <?php endif; ?>
        
        <form method="POST" action="">
            <label for="username">Nombre Completo:</label>
            <input type="text" id="username" name="username" required 
                   placeholder="Ej: Admin Principal"
                   value="<?php echo isset($_POST['username']) ? htmlspecialchars($_POST['username']) : ''; ?>">

            <label for="password">RUT:</label>
            <input type="text" id="password" name="password" required 
                   placeholder="Ej: 12345678-9"
                   value="<?php echo isset($_POST['password']) ? htmlspecialchars($_POST['password']) : ''; ?>"
                   oninput="formatearRut(this)">

            <button type="submit" class="ingreso-button">Ingresar</button>
        </form>
        
        <div style="margin-top: 20px; padding: 15px; background: #e8f4fd; border-radius: 5px; font-size: 14px;">
            <strong>📋 Credenciales de prueba:</strong><br>
            • <strong>Administrador:</strong> Admin Principal / 12345678-9<br>
            • <strong>Empleado:</strong> Juan Pérez / 87654321-5<br>
            • <strong>Empleado:</strong> María González / 11222333-4
        </div>
    </div>

    <div class="common-link" id="btnCli">
        <a href="setup_database.php">Configurar Base de Datos</a>
    </div>

    <div class="debug-info">
        <strong>Debug:</strong><br>
        Session: <?php echo session_id(); ?><br>
        DB: postgres<br>
        PHP: <?php echo phpversion(); ?>
    </div>

    <script src="scripts/script.js"></script>
    <script>
        // Mostrar formulario automáticamente si hay error
        document.addEventListener('DOMContentLoaded', function() {
            const errorMsg = document.querySelector('.error-message');
            if (errorMsg) {
                // Mostrar todo directamente
                document.getElementById('showLoginBtn').style.display = 'none';
                document.getElementById('logo').style.display = 'flex';
                document.getElementById('loginContainer').style.display = 'block';
                document.getElementById('loginContainer').classList.add('active');
                document.getElementById('btnCli').classList.add('show');
                
                // Enfocar el campo de usuario
                document.getElementById('username').focus();
            }
        });
    </script>
</body>
</html>