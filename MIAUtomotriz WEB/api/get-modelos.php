<?php
// api/get-modelos.php
error_reporting(0);
header('Content-Type: application/json; charset=utf-8');

session_start();

if(!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== TRUE){
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit();
}

require_once __DIR__ . '/../config/database.php';

try {
    $db = getDB();
    
    $marca_id = isset($_GET['marca_id']) ? (int)$_GET['marca_id'] : 0;
    
    if ($marca_id > 0) {
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
        'message' => 'Error al cargar modelos'
    ]);
}
?>