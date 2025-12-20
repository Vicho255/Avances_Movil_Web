<?php
// debug-eliminar.php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Forzar contenido como texto plano primero
header('Content-Type: text/plain; charset=utf-8');

echo "=== DEBUG ELIMINAR CLIENTE ===\n\n";

// Simular la llamada
$_SERVER['REQUEST_METHOD'] = 'POST';
$data = ['rut' => '11111111-1']; // Usa un RUT que exista

echo "1. Probando conexión a BD...\n";

try {
    require_once __DIR__ . '/../config/database.php';
    
    if (!function_exists('getDB')) {
        throw new Exception("Función getDB() no definida");
    }
    
    $db = getDB();
    echo "✅ Conexión a BD exitosa\n";
    
    echo "\n2. Verificando tabla Persona...\n";
    $query = 'SELECT COUNT(*) FROM Persona';
    $count = $db->query($query)->fetchColumn();
    echo "Total registros en Persona: $count\n";
    
    echo "\n3. Verificando cliente específico...\n";
    $queryCliente = 'SELECT RUT, Nombre, Apellido FROM Persona WHERE RUT = ? LIMIT 1';
    $stmt = $db->prepare($queryCliente);
    $stmt->execute(['11111111-1']);
    $cliente = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($cliente) {
        echo "✅ Cliente encontrado:\n";
        print_r($cliente);
        
        echo "\n4. Probando eliminación...\n";
        $queryEliminar = 'DELETE FROM Persona WHERE RUT = ?';
        $stmtEliminar = $db->prepare($queryEliminar);
        $resultado = $stmtEliminar->execute(['11111111-1']);
        
        echo "Resultado eliminación: " . ($resultado ? "true" : "false") . "\n";
        echo "Filas afectadas: " . $stmtEliminar->rowCount() . "\n";
    } else {
        echo "❌ Cliente no encontrado\n";
    }
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== FIN DEBUG ===\n";
?>