<?php
// api/eliminar-cliente.php - VERSIÓN SIMPLIFICADA Y ROBUSTA

// IMPORTANTE: No mostrar errores en producción
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

// Siempre devolver JSON
header('Content-Type: application/json; charset=utf-8');

// Buffer para capturar cualquier salida accidental
ob_start();

try {
    // 1. Validar método
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Método no permitido. Use POST.', 405);
    }
    
    // 2. Obtener y validar datos
    $input = file_get_contents('php://input');
    
    if (empty($input)) {
        throw new Exception('No se recibieron datos', 400);
    }
    
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('JSON inválido', 400);
    }
    
    if (empty($data['rut'])) {
        throw new Exception('RUT no proporcionado', 400);
    }
    
    $rut = trim($data['rut']);
    
    // 3. Conectar a la base de datos
    require_once __DIR__ . '/../config/database.php';
    
    if (!function_exists('getDB')) {
        throw new Exception('Error de configuración de base de datos');
    }
    
    $db = getDB();
    
    // 4. PRUEBA: Verificar que podemos ejecutar consultas simples
    // Primero, probar una consulta simple para ver la estructura
    $testQuery = "SELECT table_name FROM information_schema.tables 
                  WHERE table_schema = 'public' 
                  AND table_name ILIKE 'persona' 
                  LIMIT 1";
    
    $testResult = $db->query($testQuery)->fetch(PDO::FETCH_ASSOC);
    
    if (!$testResult) {
        throw new Exception('No se encontró la tabla Persona en la base de datos');
    }
    
    $tableName = $testResult['table_name'];
    
    // 5. Verificar que el cliente existe
    // Usar el nombre exacto de la tabla
    $queryVerificar = "SELECT * FROM \"$tableName\" WHERE ";
    
    // Determinar nombres de columnas
    $columnQuery = "SELECT column_name FROM information_schema.columns 
                    WHERE table_name = ? 
                    AND column_name ILIKE 'rut' 
                    LIMIT 1";
    
    $stmtCol = $db->prepare($columnQuery);
    $stmtCol->execute([$tableName]);
    $colRut = $stmtCol->fetch(PDO::FETCH_COLUMN);
    
    if (!$colRut) {
        $colRut = 'rut'; // Valor por defecto
    }
    
    // Construir consulta con nombres de columnas correctos
    $queryVerificar = "SELECT * FROM \"$tableName\" WHERE \"$colRut\" = ? AND \"tipo_persona\" = 'Cliente'";
    
    $stmtVerificar = $db->prepare($queryVerificar);
    $stmtVerificar->execute([$rut]);
    $cliente = $stmtVerificar->fetch(PDO::FETCH_ASSOC);
    
    if (!$cliente) {
        throw new Exception('Cliente no encontrado', 404);
    }
    
    // 6. Eliminar cliente
    $queryEliminar = "DELETE FROM \"$tableName\" WHERE \"$colRut\" = ?";
    $stmtEliminar = $db->prepare($queryEliminar);
    $stmtEliminar->execute([$rut]);
    
    $filasAfectadas = $stmtEliminar->rowCount();
    
    if ($filasAfectadas > 0) {
        $response = [
            'success' => true,
            'message' => 'Cliente eliminado exitosamente',
            'data' => [
                'rut' => $rut,
                'nombre' => $cliente['Nombre'] ?? $cliente['nombre'] ?? '',
                'apellido' => $cliente['Apellido'] ?? $cliente['apellido'] ?? '',
                'filas_afectadas' => $filasAfectadas
            ]
        ];
    } else {
        throw new Exception('No se pudo eliminar el cliente', 500);
    }
    
} catch (Exception $e) {
    // Limpiar buffer
    ob_end_clean();
    
    $code = $e->getCode();
    if ($code < 400 || $code > 599) {
        $code = 500;
    }
    
    http_response_code($code);
    
    $response = [
        'success' => false,
        'message' => $e->getMessage(),
        'error_code' => $code
    ];
    
    // En desarrollo, agregar más detalles
    if (isset($_GET['debug'])) {
        $response['debug'] = [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTrace()
        ];
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit();
}

// 7. Limpiar buffer y enviar respuesta exitosa
ob_end_clean();
echo json_encode($response, JSON_UNESCAPED_UNICODE);
?>