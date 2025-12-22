<?php
// api/guardar-vehiculo.php - VERSIÓN MEJORADA

error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json; charset=utf-8');

session_start();

if(!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== TRUE){
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit();
}

if($_SESSION['tipo_persona'] !== 'Administrador'){
    echo json_encode(['success' => false, 'message' => 'Permisos insuficientes']);
    exit();
}

require_once __DIR__ . '/../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['patente'])) {
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit();
}

$patente = trim(strtoupper($input['patente']));
if (!preg_match('/^[A-Z]{3,4}[0-9]{3}$/', $patente)) {
    echo json_encode(['success' => false, 'message' => 'Patente inválida']);
    exit();
}

try {
    $db = getDB();
    $db->beginTransaction();
    
    // Verificar si ya existe
    $check = $db->prepare("SELECT COUNT(*) FROM Vehiculo WHERE Patente = ?");
    $check->execute([$patente]);
    if ($check->fetchColumn() > 0) {
        echo json_encode(['success' => false, 'message' => 'La patente ya existe']);
        exit();
    }
    
    // Insertar vehículo
    $stmt = $db->prepare("
        INSERT INTO Vehiculo (Patente, Color, Motor, Pais_origen, Persona_RUT)
        VALUES (:patente, :color, NULL, NULL, :persona_rut)
    ");
    
    $stmt->execute([
        ':patente' => $patente,
        ':color' => $input['color'] ?? null,
        ':persona_rut' => !empty($input['persona_rut']) ? $input['persona_rut'] : null
    ]);
    
    // Insertar relación en Tener
    if (!empty($input['tipo_vehiculo_id']) && !empty($input['modelo_id'])) {
        $tener = $db->prepare("
            INSERT INTO Tener (Vehiculo_ID, Tipo_Vehiculo_ID, Modelo_ID)
            VALUES (:vehiculo_id, :tipo_id, :modelo_id)
        ");
        
        $tener->execute([
            ':vehiculo_id' => $patente,
            ':tipo_id' => $input['tipo_vehiculo_id'],
            ':modelo_id' => $input['modelo_id']
        ]);
    }
    
    // Insertar VIN si hay año
    if (!empty($input['anio'])) {
        $vin = $db->prepare("
            INSERT INTO VIN (VIN, Transmicion, Cilindraje, Anio, Vehiculo_ID)
            VALUES (:vin, NULL, NULL, :anio, :vehiculo_id)
        ");
        
        // Generar un VIN temporal basado en patente y año
        $vinTemp = substr($patente . str_repeat('0', 17 - strlen($patente)), 0, 17);
        
        $vin->execute([
            ':vin' => $vinTemp,
            ':anio' => $input['anio'],
            ':vehiculo_id' => $patente
        ]);
    }
    
    $db->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Vehículo registrado exitosamente',
        'patente' => $patente
    ]);
    
} catch (PDOException $e) {
    if ($db->inTransaction()) $db->rollBack();
    
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage()
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>