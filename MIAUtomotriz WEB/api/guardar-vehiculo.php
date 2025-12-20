<?php
// api/guardar-vehiculo.php - VERSIÓN PARA VEHÍCULOS

// Para debug
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Headers
header('Content-Type: application/json; charset=utf-8');

// Iniciar sesión
session_start();

// Verificar autenticación
if(!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== TRUE){
    echo json_encode([
        'success' => false,
        'error' => 'No autorizado',
        'message' => 'Debes iniciar sesión'
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
    require_once __DIR__ . '/../config/database.php';
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error de configuración',
        'message' => 'No se pudo cargar la configuración de BD'
    ]);
    exit();
}

// Leer datos JSON del request
$input = json_decode(file_get_contents('php://input'), true);

// Validar datos requeridos
if (!$input || !isset($input['patente'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Datos incompletos. La patente es requerida.'
    ]);
    exit();
}

// Validar formato de patente
$patente = trim(strtoupper($input['patente']));
if (!preg_match('/^[A-Z]{3,4}[0-9]{3}$/', $patente)) {
    echo json_encode([
        'success' => false,
        'message' => 'Formato de patente inválido. Use: ABC123 o ABCD123'
    ]);
    exit();
}

try {
    // Obtener conexión
    $db = getDB();
    
    if (!$db) {
        throw new Exception("No se pudo establecer conexión a la base de datos");
    }
    
    // Iniciar transacción
    $db->beginTransaction();
    
    // 1. Verificar si la patente ya existe
    $checkQuery = "SELECT COUNT(*) FROM Vehiculo WHERE Patente = :patente";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->execute([':patente' => $patente]);
    
    if ($checkStmt->fetchColumn() > 0) {
        $db->rollBack();
        echo json_encode([
            'success' => false,
            'message' => 'La patente ya está registrada en el sistema'
        ]);
        exit();
    }
    
    // 2. Insertar en tabla Vehiculo
    $vehiculoData = [
        ':patente' => $patente,
        ':color' => $input['color'] ?? null,
        ':motor' => $input['motor'] ?? null,
        ':pais_origen' => $input['pais_origen'] ?? null,
        ':persona_rut' => $input['persona_rut'] ?? null  // Opcional: asignar a un cliente
    ];
    
    $insertVehiculoQuery = "
        INSERT INTO Vehiculo (Patente, Color, Motor, Pais_origen, Persona_RUT)
        VALUES (:patente, :color, :motor, :pais_origen, :persona_rut)
    ";
    
    $vehiculoStmt = $db->prepare($insertVehiculoQuery);
    $vehiculoStmt->execute($vehiculoData);
    
    // 3. Manejar relaciones en tabla Tener
    if (isset($input['tipo_vehiculo_id']) && isset($input['modelo_id'])) {
        $tenerData = [
            ':vehiculo_id' => $patente,
            ':tipo_vehiculo_id' => (int)$input['tipo_vehiculo_id'],
            ':modelo_id' => (int)$input['modelo_id']
        ];
        
        $insertTenerQuery = "
            INSERT INTO Tener (Vehiculo_ID, Tipo_Vehiculo_ID, Modelo_ID)
            VALUES (:vehiculo_id, :tipo_vehiculo_id, :modelo_id)
        ";
        
        $tenerStmt = $db->prepare($insertTenerQuery);
        $tenerStmt->execute($tenerData);
    }
    
    // 4. Opcional: Insertar VIN si se proporciona
    if (isset($input['vin']) && !empty($input['vin'])) {
        $vin = strtoupper(trim($input['vin']));
        
        if (strlen($vin) === 17) {
            $vinData = [
                ':vin' => $vin,
                ':transmicion' => $input['transmision'] ?? null,
                ':cilindraje' => $input['cilindraje'] ?? null,
                ':anio' => isset($input['anio']) ? (int)$input['anio'] : null,
                ':vehiculo_id' => $patente
            ];
            
            $insertVINQuery = "
                INSERT INTO VIN (VIN, Transmicion, Cilindraje, Anio, Vehiculo_ID)
                VALUES (:vin, :transmicion, :cilindraje, :anio, :vehiculo_id)
            ";
            
            $vinStmt = $db->prepare($insertVINQuery);
            $vinStmt->execute($vinData);
        }
    }
    
    // Confirmar transacción
    $db->commit();
    
    // Obtener datos completos del vehículo recién creado
    $getVehiculoQuery = "
        SELECT 
            v.Patente,
            v.Color,
            v.Motor,
            v.Pais_origen,
            tv.Nombre as tipo_vehiculo,
            m.Nombre as modelo,
            ma.Nombre as marca
        FROM Vehiculo v
        LEFT JOIN Tener t ON t.Vehiculo_ID = v.Patente
        LEFT JOIN Tipo_Vehiculo tv ON tv.Codigo = t.Tipo_Vehiculo_ID
        LEFT JOIN Modelo m ON m.Codigo = t.Modelo_ID
        LEFT JOIN Marca ma ON ma.Codigo = m.Marca_ID
        WHERE v.Patente = :patente
    ";
    
    $getStmt = $db->prepare($getVehiculoQuery);
    $getStmt->execute([':patente' => $patente]);
    $nuevoVehiculo = $getStmt->fetch(PDO::FETCH_ASSOC);
    
    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'message' => 'Vehículo registrado exitosamente',
        'vehiculo' => $nuevoVehiculo,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (PDOException $e) {
    // Rollback en caso de error
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    
    // Manejar errores específicos de BD
    $errorCode = $e->getCode();
    
    if ($errorCode === '23505') { // Violación de unicidad
        $message = 'La patente ya está registrada';
    } elseif ($errorCode === '23503') { // Violación de clave foránea
        $message = 'Error de referencia: Verifique los IDs de tipo, modelo o cliente';
    } else {
        $message = 'Error de base de datos: ' . $e->getMessage();
    }
    
    echo json_encode([
        'success' => false,
        'error' => 'Error de BD',
        'message' => $message,
        'code' => $errorCode
    ]);
    
} catch (Exception $e) {
    // Error general
    echo json_encode([
        'success' => false,
        'error' => 'Error del servidor',
        'message' => $e->getMessage()
    ]);
}

exit();
?>