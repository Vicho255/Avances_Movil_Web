<?php
// api/actualizar-estado-tarea.php
session_start();

if (!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== TRUE) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'No autorizado']);
    exit();
}

$rut_empleado = $_SESSION['rut'] ?? '';

require_once __DIR__ . '/../config/database.php';

try {
    $pdo = getDB();
} catch (Exception $e) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Error de conexión: ' . $e->getMessage()]);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
$orden_numero = $data['orden_numero'] ?? 0;
$nuevo_estado = $data['estado'] ?? '';
$notas = $data['notas'] ?? '';

if (!$orden_numero || !$nuevo_estado) {
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit();
}

// Validar que el empleado sea asignado a esta orden
$query_check = "
    SELECT COUNT(*) 
    FROM Agenda_Empleado 
    WHERE Empleado_RUT = :empleado_id 
    AND Orden_Trabajo_Numero = :orden_id
";
$stmt_check = $pdo->prepare($query_check);
$stmt_check->execute([
    ':empleado_id' => $rut_empleado,
    ':orden_id' => $orden_numero
]);

if ($stmt_check->fetchColumn() == 0) {
    echo json_encode(['success' => false, 'message' => 'No tienes permiso para modificar esta orden']);
    exit();
}

header('Content-Type: application/json');

try {
    $pdo->beginTransaction();
    
    // 1. Actualizar estado de la orden
    $query_estado = "UPDATE Orden_Trabajo SET Estado = :estado WHERE Numero = :orden_id";
    $stmt_estado = $pdo->prepare($query_estado);
    $stmt_estado->execute([
        ':estado' => $nuevo_estado,
        ':orden_id' => $orden_numero
    ]);
    
    // 2. Registrar en historial de estados
    $query_historial = "
        INSERT INTO Historial_Estados 
        (Orden_Trabajo_Numero, Estado, Empleado_RUT, Notas, Fecha_Cambio) 
        VALUES (:orden_id, :estado, :empleado_id, :notas, CURRENT_TIMESTAMP)
    ";
    $stmt_historial = $pdo->prepare($query_historial);
    $stmt_historial->execute([
        ':orden_id' => $orden_numero,
        ':estado' => $nuevo_estado,
        ':empleado_id' => $rut_empleado,
        ':notas' => $notas
    ]);
    
    // 3. Si se completa la orden, registrar fecha de finalización
    if ($nuevo_estado == 'Completada') {
        $query_completar = "
            UPDATE Orden_Trabajo 
            SET Fecha_Finalizacion = CURRENT_TIMESTAMP 
            WHERE Numero = :orden_id
        ";
        $stmt_completar = $pdo->prepare($query_completar);
        $stmt_completar->execute([':orden_id' => $orden_numero]);
    }
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Estado actualizado exitosamente',
        'orden_numero' => $orden_numero,
        'nuevo_estado' => $nuevo_estado
    ]);
    
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode([
        'success' => false,
        'message' => 'Error al actualizar estado: ' . $e->getMessage()
    ]);
}
?>