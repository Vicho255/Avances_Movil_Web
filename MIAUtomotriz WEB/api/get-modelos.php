<?php
// api/get-modelos.php
header('Content-Type: application/json; charset=utf-8');
session_start();

if(!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== TRUE){
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit();
}

try {
    require_once __DIR__ . '/../config/database.php';
    $db = getDB();
    
    $marca_id = $_GET['marca_id'] ?? null;
    
    if ($marca_id) {
        $query = "SELECT Codigo, Nombre FROM Modelo WHERE Marca_ID = :marca_id ORDER BY Nombre";
        $stmt = $db->prepare($query);
        $stmt->execute([':marca_id' => $marca_id]);
    } else {
        $query = "SELECT Codigo, Nombre FROM Modelo ORDER BY Nombre";
        $stmt = $db->query($query);
    }
    
    $modelos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $modelos
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>