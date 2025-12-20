<?php
// api/asignar-orden.php

error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');
session_start();

if(!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== TRUE){
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit();
}

if($_SESSION['tipo_persona'] !== 'Empleado'){
    echo json_encode(['success' => false, 'message' => 'Permisos insuficientes']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['orden_numero']) || !isset($input['fecha_agenda']) || !isset($input['hora_inicio'])) {
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit();
}

$rut_empleado = $_SESSION['rut'] ?? '';

try {
    require_once __DIR__ . '/../config/database.php';
    $db = getDB();
    
    if (!$db) {
        throw new Exception("Error de conexión a BD");
    }
    
    // Verificar si la tabla Agenda_Empleado existe, si no, crearla
    $checkTable = $db->query("SELECT EXISTS (SELECT FROM information_schema.tables 
                           WHERE table_name = 'agenda_empleado')");
    
    if (!$checkTable->fetchColumn()) {
        // Crear tabla si no existe
        $createTable = "
            CREATE TABLE Agenda_Empleado (
                Empleado_RUT VARCHAR(12) NOT NULL,
                Orden_Trabajo_Numero INT NOT NULL,
                Fecha_Agenda DATE NOT NULL,
                Hora_Inicio TIME NOT NULL,
                Hora_Fin TIME,
                PRIMARY KEY (Empleado_RUT, Orden_Trabajo_Numero),
                FOREIGN KEY (Empleado_RUT) REFERENCES Persona(RUT) ON DELETE CASCADE,
                FOREIGN KEY (Orden_Trabajo_Numero) REFERENCES Orden_Trabajo(Numero) ON DELETE CASCADE
            )
        ";
        $db->exec($createTable);
    }
    
    // Verificar si la orden ya está asignada
    $checkQuery = "SELECT COUNT(*) FROM Agenda_Empleado WHERE Orden_Trabajo_Numero = :orden_numero";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->execute([':orden_numero' => $input['orden_numero']]);
    
    if ($checkStmt->fetchColumn() > 0) {
        echo json_encode([
            'success' => false, 
            'message' => 'Esta orden ya está asignada a otro empleado'
        ]);
        exit();
    }
    
    // Calcular hora fin (2 horas después por defecto)
    $horaFin = $input['hora_fin'] ?? date('H:i:s', strtotime($input['hora_inicio'] . ' +2 hours'));
    
    // Insertar en agenda
    $insertQuery = "
        INSERT INTO Agenda_Empleado 
        (Empleado_RUT, Orden_Trabajo_Numero, Fecha_Agenda, Hora_Inicio, Hora_Fin)
        VALUES (:rut_empleado, :orden_numero, :fecha_agenda, :hora_inicio, :hora_fin)
    ";
    
    $stmt = $db->prepare($insertQuery);
    $result = $stmt->execute([
        ':rut_empleado' => $rut_empleado,
        ':orden_numero' => $input['orden_numero'],
        ':fecha_agenda' => $input['fecha_agenda'],
        ':hora_inicio' => $input['hora_inicio'],
        ':hora_fin' => $horaFin
    ]);
    
    if ($result) {
        // Actualizar estado de la orden a "En Proceso"
        $updateQuery = "UPDATE Orden_Trabajo SET Estado = 'En Proceso' WHERE Numero = :orden_numero";
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->execute([':orden_numero' => $input['orden_numero']]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Orden asignada exitosamente'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error al asignar la orden'
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor'
    ]);
}

exit();
?>