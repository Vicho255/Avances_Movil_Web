<?php
// api/get-mano-obra.php
session_start();

if (!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== TRUE) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'No autorizado']);
    exit();
}

$ordenId = $_GET['orden_id'] ?? 0;

if (!$ordenId) {
    echo json_encode(['success' => false, 'message' => 'ID de orden requerido']);
    exit();
}

require_once __DIR__ . '/../config/database.php';

try {
    $pdo = getDB();
    
    // Obtener mano de obra de la orden
    $query = "
        SELECT mo.descripcion, mo.costo
        FROM trabajar_2 t2
        JOIN mano_de_obra mo ON t2.mano_de_obra_id = mo.codigo
        WHERE t2.orden_trabajo_id = :orden_id
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([':orden_id' => $ordenId]);
    $manoObra = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Si no hay mano de obra registrada, devolver valores por defecto
    if (empty($manoObra)) {
        $manoObra = [
            ['descripcion' => 'Mano de obra general', 'costo' => 50000]
        ];
    }
    
    header('Content-Type: application/json');
    echo json_encode($manoObra, JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener mano de obra: ' . $e->getMessage()
    ]);
}
?>