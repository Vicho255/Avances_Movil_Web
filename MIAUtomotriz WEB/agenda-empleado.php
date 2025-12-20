<?php
session_start();

// VERIFICACIÓN DE SESIÓN
if(!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== TRUE){
    header('Location: login.php');
    exit();
}

// Verificar que sea empleado
if($_SESSION['tipo_persona'] !== 'Empleado'){
    header('Location: login.php');
    exit();
}

// Obtener datos del usuario de la sesión
$nombre_usuario = $_SESSION['usuario'] ?? 'Empleado';
$rut_usuario = $_SESSION['rut'] ?? '';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agenda Empleado</title>
    <link rel="stylesheet" href="styles/layout.css">
    <link rel="stylesheet" href="styles/agenda-empleado.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body>
    <!-- Sidebar Navigation -->
    <?php include 'components/sidebar-empleado.php'; ?>

    <!-- Main Content -->
    <main class="main-content">
        <!-- Header -->
        <?php include 'components/header-empleado.php'; ?>

        <!-- Agenda Section -->
        <section class="agenda-section">
            <h1>Agenda de <?php echo htmlspecialchars($nombre_usuario); ?></h1>
            <div id="agenda-container">
                <!-- Aquí se cargará la agenda mediante JavaScript -->
            </div>
        </section>
    </main>
    <script src="scripts/agenda-empleado.js"></script>
    <script src="components/theme-manager.js"></script>
</body>
