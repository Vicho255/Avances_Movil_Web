<?php
// api/get-detalle-orden.php - VERSIÓN CORREGIDA
session_start();

if (!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== TRUE) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'No autorizado']);
    exit();
}

$rut_usuario = $_SESSION['rut'] ?? '';

require_once __DIR__ . '/../config/database.php';

try {
    $pdo = getDB();
} catch (Exception $e) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Error de conexión: ' . $e->getMessage()]);
    exit();
}

$numero_orden = $_GET['numero'] ?? 0;

if (!$numero_orden) {
    echo json_encode(['success' => false, 'message' => 'Número de orden requerido']);
    exit();
}

header('Content-Type: application/json');

try {
    // Consulta para obtener detalles completos de la orden - CORREGIDA
    $query = "
        SELECT 
            ot.Numero,
            ot.Fecha,
            ot.Descripcion,
            ot.Vehiculo_ID,
            ot.Estado,
            v.Patente,
            p.Nombre || ' ' || p.Apellido as Cliente_Nombre,
            ma.Nombre as marca,
            mo.Nombre as modelo,
            ae.Fecha_Agenda,
            ae.Hora_Inicio,
            ae.Hora_Fin,
            STRING_AGG(av.Nombre, ', ') as averias
            
        FROM Orden_Trabajo ot
        
        JOIN Vehiculo v ON v.Patente = ot.Vehiculo_ID
        JOIN Persona p ON p.RUT = v.Persona_RUT
        LEFT JOIN Tener t ON t.Vehiculo_ID = v.Patente
        LEFT JOIN Modelo mo ON mo.Codigo = t.Modelo_ID
        LEFT JOIN Marca ma ON ma.Codigo = mo.Marca_ID
        LEFT JOIN Agenda_Empleado ae ON ae.Orden_Trabajo_Numero = ot.Numero
        LEFT JOIN Orden_Averia oa ON oa.Orden_Trabajo_Numero = ot.Numero
        LEFT JOIN Averia av ON av.Codigo = oa.Averia_ID
        
        WHERE ot.Numero = :numero_orden
        
        GROUP BY ot.Numero, ot.Fecha, ot.Descripcion, ot.Vehiculo_ID, 
                 ot.Estado, v.Patente, p.Nombre, p.Apellido, 
                 ma.Nombre, mo.Nombre, ae.Fecha_Agenda, 
                 ae.Hora_Inicio, ae.Hora_Fin
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([':numero_orden' => $numero_orden]);
    $orden = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$orden) {
        echo json_encode(['success' => false, 'message' => 'Orden no encontrada']);
        exit();
    }
    
    // Obtener repuestos utilizados
    $query_repuestos = "
        SELECT 
            p.Codigo,
            p.Nombre,
            hr.Cantidad_Instalada,
            hr.Costo_Unitario
        FROM Historial_Repuestos_Vehiculo hr
        JOIN Pieza p ON p.Codigo = hr.Repuesto_Codigo
        WHERE hr.Orden_Trabajo_Numero = :numero_orden
    ";
    
    $stmt_repuestos = $pdo->prepare($query_repuestos);
    $stmt_repuestos->execute([':numero_orden' => $numero_orden]);
    $repuestos = $stmt_repuestos->fetchAll(PDO::FETCH_ASSOC);
    
    // Obtener mano de obra asociada
    $query_mano_obra = "
        SELECT 
            mo.Codigo,
            mo.Descripcion,
            mo.Costo
        FROM Trabajar_2 t2
        JOIN Mano_de_Obra mo ON t2.Mano_de_Obra_ID = mo.Codigo
        WHERE t2.Orden_Trabajo_ID = :numero_orden
    ";
    
    $stmt_mano_obra = $pdo->prepare($query_mano_obra);
    $stmt_mano_obra->execute([':numero_orden' => $numero_orden]);
    $mano_obra = $stmt_mano_obra->fetchAll(PDO::FETCH_ASSOC);
    
    // Si no hay mano de obra, usar valor por defecto
    if (empty($mano_obra)) {
        $mano_obra = [
            ['Descripcion' => 'Mano de obra general', 'Costo' => 50000]
        ];
    }
    
    echo json_encode([
        'success' => true,
        'orden' => $orden,
        'repuestos' => $repuestos,
        'mano_obra' => $mano_obra
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener detalles: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString() // Solo para desarrollo
    ]);
}
?>