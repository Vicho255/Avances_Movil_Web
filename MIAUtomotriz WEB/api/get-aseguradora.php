<?php
// api/get-aseguradoras.php - Versión para PostgreSQL con tabla en camel case
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar solicitudes OPTIONS para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Para desarrollo, desactivar verificación de sesión temporalmente
$modoDesarrollo = true;

if (!$modoDesarrollo) {
    session_start();
    if(!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== TRUE){
        http_response_code(401);
        echo json_encode([
            'success' => false, 
            'error' => 'No autorizado',
            'message' => 'Debe iniciar sesión'
        ]);
        exit();
    }
}

try {
    // Incluir configuración de base de datos
    require_once __DIR__ . '/../config/database.php';
    
    // Verificar si la función getDB() existe
    if (!function_exists('getDB')) {
        throw new Exception("Función getDB() no encontrada");
    }
    
    $db = getDB();
    
    // Verificar conexión
    if (!$db) {
        throw new Exception("No se pudo conectar a la base de datos");
    }
    
    // CONSULTA CORRECTA PARA POSTGRESQL CON CAMEL CASE
    $query = 'SELECT "ID", "Nombre_Empresa", "Nombre_Contacto" FROM "Aseguradora" ORDER BY "Nombre_Empresa"';
    
    error_log("🔄 Ejecutando consulta: " . $query);
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $aseguradoras = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("📊 Resultados encontrados: " . count($aseguradoras));
    
    // Si hay resultados, mostrar el primero para debug
    if (count($aseguradoras) > 0) {
        error_log("🔍 Primer registro: " . json_encode($aseguradoras[0]));
    }
    
    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'count' => count($aseguradoras),
        'data' => $aseguradoras,
        'debug' => [
            'timestamp' => date('Y-m-d H:i:s'),
            'query' => $query,
            'driver' => $db->getAttribute(PDO::ATTR_DRIVER_NAME),
            'table' => 'Aseguradora'
        ]
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    // Log del error
    error_log("❌ Error en get-aseguradoras.php: " . $e->getMessage());
    error_log("📍 Archivo: " . __FILE__ . " Línea: " . __LINE__);
    error_log("🔧 Trace: " . $e->getTraceAsString());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error del servidor',
        'message' => $e->getMessage(),
        'debug' => [
            'archivo' => __FILE__,
            'linea' => __LINE__,
            'trace' => $e->getTraceAsString()
        ]
    ], JSON_UNESCAPED_UNICODE);
}
?>