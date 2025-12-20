<?php
// api/guardar-cliente.php

header('Content-Type: application/json; charset=utf-8');
error_reporting(0);
ini_set('display_errors', 0);

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

if($_SESSION['tipo_persona'] !== 'Administrador'){
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
        'message' => $e->getMessage()
    ]);
    exit();
}

// Verificar método
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'error' => 'Método no permitido',
        'message' => 'Solo se permite POST'
    ]);
    exit();
}

// Obtener datos JSON
$input = json_decode(file_get_contents('php://input'), true);

// Si no viene JSON, intentar con POST normal
if (!$input) {
    $input = $_POST;
}

// Validar datos requeridos
if (empty($input['rut']) || empty($input['nombre']) || empty($input['apellido'])) {
    echo json_encode([
        'success' => false,
        'error' => 'Datos incompletos',
        'message' => 'RUT, Nombre y Apellido son requeridos'
    ]);
    exit();
}

// Función para validar RUT chileno
function validarRUT($rut) {
    if (!preg_match('/^[0-9]{7,8}-[0-9Kk]$/', $rut)) {
        return false;
    }
    
    list($numero, $dv) = explode('-', $rut);
    $dv = strtoupper($dv);
    
    $i = 2;
    $suma = 0;
    foreach (array_reverse(str_split($numero)) as $v) {
        if ($i > 7) $i = 2;
        $suma += $v * $i;
        $i++;
    }
    
    $dvr = 11 - ($suma % 11);
    if ($dvr == 11) $dvr = 0;
    if ($dvr == 10) $dvr = 'K';
    
    return $dvr == $dv;
}

// Validar RUT
if (!validarRUT($input['rut'])) {
    echo json_encode([
        'success' => false,
        'error' => 'RUT inválido',
        'message' => 'El RUT no tiene un formato válido (ej: 12345678-9)'
    ]);
    exit();
}

try {
    $db = getDB();
    
    // Iniciar transacción
    $db->beginTransaction();
    
    // 1. Verificar si el RUT ya existe
    $stmt = $db->prepare("SELECT COUNT(*) FROM Persona WHERE RUT = ?");
    $stmt->execute([$input['rut']]);
    
    if ($stmt->fetchColumn() > 0) {
        throw new Exception("El RUT {$input['rut']} ya está registrado");
    }
    
    // 2. Insertar en tabla Persona
    $stmt = $db->prepare("
        INSERT INTO Persona (
            RUT, Nombre, Apellido, Tipo_Persona, 
            Fecha_Nac, Direccion_codigo_postal, Aseguradora_ID
        ) VALUES (?, ?, ?, 'Cliente', ?, ?, ?)
    ");
    
    $fecha_nac = !empty($input['fecha_nac']) ? $input['fecha_nac'] : null;
    $direccion_cp = !empty($input['direccion_cp']) ? $input['direccion_cp'] : null;
    $aseguradora_id = !empty($input['aseguradora_id']) ? $input['aseguradora_id'] : 'Sin Aseguradora';
    
    $stmt->execute([
        $input['rut'],
        trim($input['nombre']),
        trim($input['apellido']),
        $fecha_nac,
        $direccion_cp,
        $aseguradora_id
    ]);
    
    // 3. Insertar teléfono si se proporcionó
    if (!empty($input['telefono'])) {
        $stmt = $db->prepare("
            INSERT INTO Telefono_Persona (Telefono, Persona_ID)
            VALUES (?, ?)
        ");
        $stmt->execute([trim($input['telefono']), $input['rut']]);
    }
    
    // 4. Insertar correo si se proporcionó
    if (!empty($input['email'])) {
        // Separar email en partes (correo@dominio.com)
        $email_parts = explode('@', $input['email'], 2);
        $correo = $email_parts[0];
        $terminacion = isset($email_parts[1]) ? $email_parts[1] : '';
        
        $stmt = $db->prepare("
            INSERT INTO Correo_Persona (Correo, Terminacion, Persona_ID)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([trim($correo), trim($terminacion), $input['rut']]);
    }
    
    // Confirmar transacción
    $db->commit();
    
    // Obtener datos del cliente recién creado para respuesta
    $stmt = $db->prepare("
        SELECT 
            p.RUT,
            p.Nombre,
            p.Apellido,
            p.Fecha_Registro,
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
        WHERE p.RUT = ?
    ");
    
    $stmt->execute([$input['rut']]);
    $cliente = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'message' => 'Cliente registrado exitosamente',
        'cliente' => $cliente,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    // Revertir transacción en caso de error
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    
    // Manejar errores específicos de PostgreSQL
    $errorCode = $e->getCode();
    $errorMessage = $e->getMessage();
    
    if ($errorCode == '23505') { // Violación de unique constraint
        echo json_encode([
            'success' => false,
            'error' => 'RUT duplicado',
            'message' => 'El RUT ya está registrado en el sistema'
        ], JSON_UNESCAPED_UNICODE);
    } elseif ($errorCode == '23503') { // Violación de foreign key
        echo json_encode([
            'success' => false,
            'error' => 'Datos inválidos',
            'message' => 'La aseguradora o dirección no existe'
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Error de base de datos',
            'message' => $errorMessage,
            'code' => $errorCode
        ], JSON_UNESCAPED_UNICODE);
    }
    
} catch (Exception $e) {
    // Revertir transacción en caso de error
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    
    echo json_encode([
        'success' => false,
        'error' => 'Error general',
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>