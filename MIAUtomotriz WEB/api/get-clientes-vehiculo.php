<?php
// api/get-clientes-vehiculo.php

error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json; charset=utf-8');

session_start();

if(!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== TRUE){
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit();
}

require_once __DIR__ . '/../config/database.php';

try {
    $db = getDB();
    
    $query = "SELECT RUT, Nombre, Apellido FROM Persona WHERE Tipo_Persona = 'Cliente' ORDER BY Nombre";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $clientes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $clientes
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>