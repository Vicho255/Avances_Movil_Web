<?php
// api/get-vehiculos.php - VERSIÓN CORREGIDA

// IMPORTANTE: Solo activar errores en desarrollo
// En producción usar: error_reporting(0);
error_reporting(E_ALL);
ini_set('display_errors', 0); // NO mostrar errores en la respuesta

// ESTOS HEADERS VAN PRIMERO
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

// Buffer de salida para capturar cualquier error
ob_start();

try {
    // Incluir conexión a BD - AJUSTA LA RUTA SEGÚN TU ESTRUCTURA
    $configPath = __DIR__ . '/../config/database.php';
    
    if (!file_exists($configPath)) {
        throw new Exception("Archivo de configuración no encontrado: " . $configPath);
    }
    
    require_once $configPath;
    
    // Verificar si la función getDB() existe
    if (!function_exists('getDB')) {
        throw new Exception("Función getDB() no definida en database.php");
    }
    
    // Obtener conexión
    $db = getDB();
    
    if (!$db) {
        throw new Exception("No se pudo establecer conexión a la base de datos");
    }

    // Consulta optimizada para obtener vehículos
    $query = "
        SELECT 
            v.Patente,
            v.Color,
            v.Motor,
            v.Pais_origen,
            v.Persona_RUT,
            
            -- Información del VIN
            vin.VIN,
            vin.Transmicion,
            vin.Cilindraje,
            vin.Anio,
            
            -- Información del tipo de vehículo
            tv.Nombre as tipo_vehiculo,
            
            -- Información del modelo
            m.Nombre as modelo,
            
            -- Información de la marca (a través del modelo)
            ma.Nombre as marca,
            
            -- Información del propietario
            p.Nombre as cliente_nombre,
            p.Apellido as cliente_apellido
            
        FROM Vehiculo v
        
        -- Relación con VIN (LEFT JOIN porque puede no existir)
        LEFT JOIN VIN vin ON vin.Vehiculo_ID = v.Patente
        
        -- Relación con Tener para obtener tipo y modelo
        LEFT JOIN Tener t ON t.Vehiculo_ID = v.Patente
        
        -- Relación con Tipo_Vehiculo
        LEFT JOIN Tipo_Vehiculo tv ON tv.Codigo = t.Tipo_Vehiculo_ID
        
        -- Relación con Modelo
        LEFT JOIN Modelo m ON m.Codigo = t.Modelo_ID
        
        -- Relación con Marca (a través del Modelo)
        LEFT JOIN Marca ma ON ma.Codigo = m.Marca_ID
        
        -- Relación con Persona (propietario)
        LEFT JOIN Persona p ON p.RUT = v.Persona_RUT
        
        ORDER BY v.Patente
    ";
    
    $stmt = $db->prepare($query);
    
    if (!$stmt) {
        throw new Exception("Error preparando la consulta: " . implode(" ", $db->errorInfo()));
    }
    
    $stmt->execute();
    
    // Verificar errores en la ejecución
    if ($stmt->errorCode() !== '00000') {
        $errorInfo = $stmt->errorInfo();
        throw new Exception("Error ejecutando consulta: " . $errorInfo[2]);
    }
    
    $vehiculos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Si no hay vehículos, array vacío
    if (!$vehiculos) {
        $vehiculos = [];
    }
    
    // Formatear respuesta
    $vehiculosFormateados = [];
    
    foreach ($vehiculos as $vehiculo) {
        $vehiculosFormateados[] = [
            'patente' => $vehiculo['patente'] ?? '',
            'tipo_vehiculo' => $vehiculo['tipo_vehiculo'] ?? 'No especificado',
            'marca' => $vehiculo['marca'] ?? 'No especificada',
            'modelo' => $vehiculo['modelo'] ?? 'No especificado',
            'anio' => $vehiculo['Anio'] ?? null,
            'color' => $vehiculo['Color'] ?? '',
            'motor' => $vehiculo['Motor'] ?? '',
            'pais_origen' => $vehiculo['Pais_origen'] ?? '',
            'transmision' => $vehiculo['Transmicion'] ?? '', // Nota: typo en la BD
            'cilindraje' => $vehiculo['Cilindraje'] ?? '',
            'vin' => $vehiculo['VIN'] ?? '',
            'propietario' => [
                'rut' => $vehiculo['Persona_RUT'] ?? '',
                'nombre' => $vehiculo['cliente_nombre'] ?? '',
                'apellido' => $vehiculo['cliente_apellido'] ?? ''
            ]
        ];
    }
    
    // Limpiar buffer de salida
    ob_end_clean();
    
    // Devolver respuesta JSON exitosa
    $response = [
        'success' => true,
        'count' => count($vehiculosFormateados),
        'data' => $vehiculosFormateados,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    // Limpiar buffer primero
    ob_end_clean();
    
    // Error específico de BD
    $errorResponse = [
        'success' => false,
        'error' => 'Error de base de datos',
        'message' => 'Error en la consulta SQL',
        'code' => $e->getCode()
    ];
    
    // Solo incluir detalles en desarrollo
    if (ini_get('display_errors')) {
        $errorResponse['debug'] = [
            'pdo_message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ];
    }
    
    echo json_encode($errorResponse, JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    // Limpiar buffer primero
    ob_end_clean();
    
    // Error general
    $errorResponse = [
        'success' => false,
        'error' => 'Error del servidor',
        'message' => 'Error interno del servidor'
    ];
    
    // Solo incluir detalles en desarrollo
    if (ini_get('display_errors')) {
        $errorResponse['debug'] = [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ];
    }
    
    echo json_encode($errorResponse, JSON_UNESCAPED_UNICODE);
}

// Asegurar que no haya salida después
exit();
?>