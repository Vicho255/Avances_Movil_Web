<?php
// api/guardar-factura.php
session_start();

if (!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== TRUE || $_SESSION['tipo_persona'] !== 'Administrador') {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit();
}

header('Content-Type: application/json');

try {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$data) {
        echo json_encode(['success' => false, 'message' => 'Datos inválidos']);
        exit();
    }
    
    // Validar datos requeridos
    $required = ['cliente_rut', 'orden_trabajo_numero', 'fecha_emision', 'neto', 'iva', 'total', 'metodo_pago'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            echo json_encode(['success' => false, 'message' => "Campo requerido faltante: $field"]);
            exit();
        }
    }
    
    require_once __DIR__ . '/../config/database.php';
    $pdo = getDB();
    
    // Obtener aseguradora del cliente
    $queryAseguradora = "SELECT aseguradora_id FROM persona WHERE rut = :rut";
    $stmtAseguradora = $pdo->prepare($queryAseguradora);
    $stmtAseguradora->execute([':rut' => $data['cliente_rut']]);
    $cliente = $stmtAseguradora->fetch();
    
    $aseguradoraId = $cliente['aseguradora_id'] ?? null;
    if ($aseguradoraId === 'Sin Aseguradora') {
        $aseguradoraId = null;
    }
    
    // Insertar factura
    $query = "
        INSERT INTO factura (
            total, neto, iva, metodo_pago, detalle_prestacion_servicio,
            fecha_emision, aseguradora_id, orden_trabajo_numero
        ) VALUES (
            :total, :neto, :iva, :metodo_pago, :detalle,
            :fecha_emision, :aseguradora_id, :orden_trabajo_numero
        ) RETURNING numero
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([
        ':total' => $data['total'],
        ':neto' => $data['neto'],
        ':iva' => $data['iva'],
        ':metodo_pago' => $data['metodo_pago'],
        ':detalle' => $data['detalle_prestacion_servicio'] ?? 'Servicio automotriz',
        ':fecha_emision' => $data['fecha_emision'],
        ':aseguradora_id' => $aseguradoraId,
        ':orden_trabajo_numero' => $data['orden_trabajo_numero']
    ]);
    
    $facturaNumero = $stmt->fetchColumn();
    
    echo json_encode([
        'success' => true,
        'factura_numero' => $facturaNumero,
        'message' => 'Factura guardada correctamente'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al guardar factura: ' . $e->getMessage()
    ]);
}
?>