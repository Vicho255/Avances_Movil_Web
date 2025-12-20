<?php
// api/get-tipos-vehiculo.php
header('Content-Type: application/json; charset=utf-8');
session_start();

if(!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== TRUE){
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit();
}

try {
    require_once __DIR__ . '/../config/database.php';
    $db = getDB();
    
    $query = "SELECT Codigo, Nombre FROM Tipo_Vehiculo ORDER BY Nombre";
    $stmt = $db->query($query);
    $tipos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $tipos
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>