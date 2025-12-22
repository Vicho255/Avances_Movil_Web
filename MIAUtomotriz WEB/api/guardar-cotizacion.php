<?php
// api/guardar-cotizacion.php
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
    $required = ['cliente_rut', 'fecha_emision', 'fecha_fin', 'descripcion'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            echo json_encode(['success' => false, 'message' => "Campo requerido faltante: $field"]);
            exit();
        }
    }
    
    require_once __DIR__ . '/../config/database.php';
    $pdo = getDB();
    
    // Iniciar transacción
    $pdo->beginTransaction();
    
    // 1. Crear cotización
    $queryCotizacion = "
        INSERT INTO cotizacion (
            fecha_emision, fecha_fin, descripcion, persona_rut
        ) VALUES (
            :fecha_emision, :fecha_fin, :descripcion, :cliente_rut
        ) RETURNING numero
    ";
    
    $stmtCotizacion = $pdo->prepare($queryCotizacion);
    $stmtCotizacion->execute([
        ':fecha_emision' => $data['fecha_emision'],
        ':fecha_fin' => $data['fecha_fin'],
        ':descripcion' => $data['descripcion'],
        ':cliente_rut' => $data['cliente_rut']
    ]);
    
    $cotizacionNumero = $stmtCotizacion->fetchColumn();
    
    // 2. Agregar repuestos
    if (!empty($data['repuestos'])) {
        foreach ($data['repuestos'] as $repuesto) {
            $queryRepuesto = "
                INSERT INTO cotizacion_pieza (
                    cotizacion_id, pieza_codigo, cantidad, costo_unitario
                ) VALUES (
                    :cotizacion_id, :pieza_codigo, :cantidad, :costo_unitario
                )
            ";
            
            $stmtRepuesto = $pdo->prepare($queryRepuesto);
            $stmtRepuesto->execute([
                ':cotizacion_id' => $cotizacionNumero,
                ':pieza_codigo' => $repuesto['codigo'],
                ':cantidad' => $repuesto['cantidad'],
                ':costo_unitario' => $repuesto['costo']
            ]);
        }
    }
    
    // 3. Agregar mano de obra
    if (!empty($data['mano_obra'])) {
        foreach ($data['mano_obra'] as $manoObra) {
            $queryManoObra = "
                INSERT INTO figurar (
                    cotizacion_id, mano_de_obra_id, costo_mano_obra
                ) VALUES (
                    :cotizacion_id, :mano_de_obra_id, :costo_mano_obra
                )
            ";
            
            $stmtManoObra = $pdo->prepare($queryManoObra);
            $stmtManoObra->execute([
                ':cotizacion_id' => $cotizacionNumero,
                ':mano_de_obra_id' => $manoObra['codigo'],
                ':costo_mano_obra' => $manoObra['costo']
            ]);
        }
    }
    
    // 4. Agregar piezas externas
    if (!empty($data['piezas_externas'])) {
        foreach ($data['piezas_externas'] as $pieza) {
            $queryPiezaExterna = "
                INSERT INTO pieza_externa (
                    nombre, categoria, valor, costo, cotizacion_id
                ) VALUES (
                    :nombre, :categoria, :valor, :costo, :cotizacion_id
                )
            ";
            
            $stmtPiezaExterna = $pdo->prepare($queryPiezaExterna);
            $stmtPiezaExterna->execute([
                ':nombre' => $pieza['nombre'],
                ':categoria' => $pieza['categoria'] ?? 'Externa',
                ':valor' => $pieza['valor'],
                ':costo' => $pieza['costo'],
                ':cotizacion_id' => $cotizacionNumero
            ]);
        }
    }
    
    // 5. Si hay vehículo, actualizar información
    if (!empty($data['vehiculo_patente'])) {
        // Podrías relacionar el vehículo con la cotización si necesitas
        // Por ahora solo registramos en la descripción
        $queryUpdateDesc = "
            UPDATE cotizacion 
            SET descripcion = CONCAT(descripcion, '\nVehículo: ', :vehiculo)
            WHERE numero = :cotizacion_id
        ";
        
        $stmtUpdate = $pdo->prepare($queryUpdateDesc);
        $stmtUpdate->execute([
            ':vehiculo' => $data['vehiculo_patente'],
            ':cotizacion_id' => $cotizacionNumero
        ]);
    }
    
    $pdo->commit();
    
    // Registrar en log
    error_log("Cotización creada: #{$cotizacionNumero} para cliente: {$data['cliente_rut']}");
    
    echo json_encode([
        'success' => true,
        'cotizacion_numero' => $cotizacionNumero,
        'message' => 'Cotización guardada correctamente',
        'totales' => [
            'total_neto' => $data['total_neto'] ?? 0,
            'iva' => $data['iva'] ?? 0,
            'total' => $data['total'] ?? 0
        ]
    ]);
    
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    error_log("Error al guardar cotización: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage(),
        'error_code' => $e->getCode()
    ]);
    
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    error_log("Error al guardar cotización: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => 'Error al guardar cotización: ' . $e->getMessage()
    ]);
}
?>