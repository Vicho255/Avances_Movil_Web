<?php
// api/get-ordenes-empleado.php

// Solo activar errores en desarrollo
error_reporting(0);
ini_set('display_errors', 0);

// Headers primero
header('Content-Type: application/json; charset=utf-8');

// Iniciar sesión
session_start();

// Verificar autenticación
if(!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== TRUE){
    echo json_encode([
        'success' => false,
        'error' => 'No autorizado',
        'message' => 'Debes iniciar sesión'
    ]);
    exit();
}

// Verificar que sea empleado
if($_SESSION['tipo_persona'] !== 'Empleado'){
    echo json_encode([
        'success' => false,
        'error' => 'Permisos insuficientes',
        'message' => 'Se requieren permisos de empleado'
    ]);
    exit();
}

// Obtener RUT del empleado
$rut_empleado = $_SESSION['rut'] ?? '';

try {
    // Incluir conexión a BD
    require_once __DIR__ . '/../config/database.php';
    
    $db = getDB();
    
    if (!$db) {
        throw new Exception("No se pudo conectar a la base de datos");
    }
    
    // ============ 1. ÓRDENES DISPONIBLES ============
    // Órdenes pendientes o en proceso que no están asignadas a este empleado
    $queryDisponibles = "
        SELECT 
            ot.Numero,
            ot.Fecha,
            ot.Descripcion,
            ot.Vehiculo_ID,
            ot.Estado,
            v.Patente,
            ma.Nombre as marca,
            mo.Nombre as modelo,
            STRING_AGG(a.Descripcion, ', ') as averias
            
        FROM Orden_Trabajo ot
        
        JOIN Vehiculo v ON v.Patente = ot.Vehiculo_ID
        LEFT JOIN Tener t ON t.Vehiculo_ID = v.Patente
        LEFT JOIN Modelo mo ON mo.Codigo = t.Modelo_ID
        LEFT JOIN Marca ma ON ma.Codigo = mo.Marca_ID
        LEFT JOIN Orden_Averia oa ON oa.Orden_Trabajo_Numero = ot.Numero
        LEFT JOIN Averia a ON a.Codigo = oa.Averia_ID
        
        WHERE ot.Estado IN ('Pendiente', 'En Proceso')
        AND NOT EXISTS (
            SELECT 1 FROM Agenda_Empleado ae 
            WHERE ae.Orden_Trabajo_Numero = ot.Numero 
            AND ae.Empleado_RUT = :rut_empleado
        )
        
        GROUP BY ot.Numero, ot.Fecha, ot.Descripcion, ot.Vehiculo_ID, 
                 ot.Estado, v.Patente, ma.Nombre, mo.Nombre
        
        ORDER BY ot.Fecha ASC, ot.Numero ASC
    ";
    
    $stmtDisponibles = $db->prepare($queryDisponibles);
    $stmtDisponibles->execute([':rut_empleado' => $rut_empleado]);
    $ordenesDisponibles = $stmtDisponibles->fetchAll(PDO::FETCH_ASSOC);
    
    // ============ 2. ÓRDENES AGENDADAS ============
    // Obtener fecha de inicio y fin de la semana actual
    $fechaInicio = $_GET['fecha_inicio'] ?? date('Y-m-d', strtotime('monday this week'));
    $fechaFin = $_GET['fecha_fin'] ?? date('Y-m-d', strtotime('sunday this week'));
    
    $queryAgendadas = "
        SELECT 
            ot.Numero,
            ot.Fecha,
            ot.Descripcion,
            ot.Vehiculo_ID,
            ot.Estado,
            v.Patente,
            ma.Nombre as marca,
            mo.Nombre as modelo,
            ae.Fecha_Agenda,
            ae.Hora_Inicio,
            ae.Hora_Fin,
            STRING_AGG(a.Descripcion, ', ') as averias
            
        FROM Agenda_Empleado ae
        
        JOIN Orden_Trabajo ot ON ot.Numero = ae.Orden_Trabajo_Numero
        JOIN Vehiculo v ON v.Patente = ot.Vehiculo_ID
        LEFT JOIN Tener t ON t.Vehiculo_ID = v.Patente
        LEFT JOIN Modelo mo ON mo.Codigo = t.Modelo_ID
        LEFT JOIN Marca ma ON ma.Codigo = mo.Marca_ID
        LEFT JOIN Orden_Averia oa ON oa.Orden_Trabajo_Numero = ot.Numero
        LEFT JOIN Averia a ON a.Codigo = oa.Averia_ID
        
        WHERE ae.Empleado_RUT = :rut_empleado
        AND ae.Fecha_Agenda BETWEEN :fecha_inicio AND :fecha_fin
        
        GROUP BY ot.Numero, ot.Fecha, ot.Descripcion, ot.Vehiculo_ID, 
                 ot.Estado, v.Patente, ma.Nombre, mo.Nombre,
                 ae.Fecha_Agenda, ae.Hora_Inicio, ae.Hora_Fin
        
        ORDER BY ae.Fecha_Agenda ASC, ae.Hora_Inicio ASC
    ";
    
    $stmtAgendadas = $db->prepare($queryAgendadas);
    $stmtAgendadas->execute([
        ':rut_empleado' => $rut_empleado,
        ':fecha_inicio' => $fechaInicio,
        ':fecha_fin' => $fechaFin
    ]);
    $ordenesAgendadas = $stmtAgendadas->fetchAll(PDO::FETCH_ASSOC);
    
    // ============ 3. PREPARAR DATOS PARA EL CALENDARIO ============
    $calendario = [];
    $currentDate = $fechaInicio;
    
    while (strtotime($currentDate) <= strtotime($fechaFin)) {
        $calendario[$currentDate] = [
            'fecha' => $currentDate,
            'dia_semana' => date('l', strtotime($currentDate)),
            'ordenes' => []
        ];
        $currentDate = date('Y-m-d', strtotime($currentDate . ' +1 day'));
    }
    
    // Agrupar órdenes agendadas por fecha
    foreach ($ordenesAgendadas as $orden) {
        $fechaAgenda = $orden['Fecha_Agenda'];
        if (isset($calendario[$fechaAgenda])) {
            $calendario[$fechaAgenda]['ordenes'][] = $orden;
        }
    }
    
    // ============ 4. CONSTRUIR RESPUESTA ============
    $response = [
        'success' => true,
        'empleado' => [
            'rut' => $rut_empleado,
            'nombre' => $_SESSION['usuario'] ?? ''
        ],
        'semana' => [
            'inicio' => $fechaInicio,
            'fin' => $fechaFin,
            'actual' => date('Y-m-d')
        ],
        'ordenes_disponibles' => $ordenesDisponibles,
        'ordenes_agendadas' => $ordenesAgendadas,
        'calendario' => array_values($calendario),
        'counts' => [
            'disponibles' => count($ordenesDisponibles),
            'agendadas' => count($ordenesAgendadas)
        ]
    ];
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    // Manejo de errores
    $errorResponse = [
        'success' => false,
        'error' => 'Error del servidor',
        'message' => 'Error interno al procesar la solicitud'
    ];
    
    // Solo incluir detalles en desarrollo
    if (ini_get('display_errors')) {
        $errorResponse['debug'] = $e->getMessage();
    }
    
    echo json_encode($errorResponse, JSON_UNESCAPED_UNICODE);
}

exit();
?>