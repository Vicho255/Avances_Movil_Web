<?php
// api/get-clientes.php - VERSIÓN CORREGIDA

// IMPORTANTE: No mostrar errores PHP en producción
// error_reporting(0);
// ini_set('display_errors', 0);

// Para debug, activar errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

// ESTOS HEADERS VAN PRIMERO, ANTES DE CUALQUIER SALIDA
header('Content-Type: application/json; charset=utf-8');

// Iniciar sesión
session_start();

// Verificar autenticación
if(!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== TRUE){
    echo json_encode([
        'success' => false,
        'error' => 'No autorizado',
        'message' => 'Debes iniciar sesión para acceder a esta función'
    ]);
    exit();
}

// Verificar que sea administrador
if(!isset($_SESSION['tipo_persona']) || $_SESSION['tipo_persona'] !== 'Administrador'){
    echo json_encode([
        'success' => false,
        'error' => 'Permisos insuficientes',
        'message' => 'Se requieren permisos de administrador'
    ]);
    exit();
}

// Incluir conexión a BD
try {
    // Ajusta la ruta según tu estructura
    require_once __DIR__ . '/../config/database.php';
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error de configuración',
        'message' => 'No se pudo cargar la configuración de base de datos: ' . $e->getMessage()
    ]);
    exit();
}

try {
    // Obtener conexión
    $db = getDB();
    
    if (!$db) {
        throw new Exception("No se pudo establecer conexión a la base de datos");
    }
    
    // Verificar conexión
    $db->query("SELECT 1");
    
    // Consulta para obtener clientes
    // NOTA: Asumiendo que tu tabla Persona tiene estos campos
    $query = "
        SELECT 
            p.RUT,
            p.Nombre,
            p.Apellido,
            p.Tipo_Persona,
            p.Fecha_Nac,
            p.Fecha_Registro,
            p.Direccion_codigo_postal,
            p.Aseguradora_ID,
            COALESCE(
                (SELECT cp.Correo || '@' || cp.Terminacion 
                 FROM Correo_Persona cp 
                 WHERE cp.Persona_ID = p.RUT 
                 LIMIT 1),
                'No registrado'
            ) as email,
            COALESCE(
                (SELECT tp.Telefono 
                 FROM Telefono_Persona tp 
                 WHERE tp.Persona_ID = p.RUT 
                 LIMIT 1),
                'No registrado'
            ) as telefono
        FROM Persona p
        WHERE p.Tipo_Persona = 'Cliente'
        ORDER BY p.Fecha_Registro DESC
    ";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $clientes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Si no hay clientes, array vacío
    if (!$clientes) {
        $clientes = [];
    }
    
    // Devolver respuesta JSON
    $response = [
        'success' => true,
        'count' => count($clientes),
        'data' => $clientes,
        'timestamp' => date('Y-m-d H:i:s'),
        'debug' => [
            'sesion_usuario' => $_SESSION['usuario'] ?? 'No definido',
            'sesion_tipo' => $_SESSION['tipo_persona'] ?? 'No definido'
        ]
    ];
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    // Error específico de BD
    $errorResponse = [
        'success' => false,
        'error' => 'Error de base de datos',
        'message' => $e->getMessage(),
        'code' => $e->getCode()
    ];
    
    // Solo incluir detalles en debug
    if (ini_get('display_errors')) {
        $errorResponse['debug'] = [
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ];
    }
    
    echo json_encode($errorResponse, JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    // Error general
    echo json_encode([
        'success' => false,
        'error' => 'Error del servidor',
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

// Asegurar que no haya salida después
exit();
?>