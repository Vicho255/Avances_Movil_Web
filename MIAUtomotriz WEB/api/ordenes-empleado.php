<?php
// api/ordenes-empleado.php
session_start();

// Verificar sesión de empleado
if (!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== TRUE || $_SESSION['tipo_persona'] !== 'Empleado') {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'No autorizado', 'redirect' => 'login.php']);
    exit();
}

// Obtener RUT del empleado desde la sesión
$rut_empleado = $_SESSION['rut'] ?? '';

require_once __DIR__ . '/../config/database.php';

try {
    $pdo = getDB();
} catch (Exception $e) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Error de conexión: ' . $e->getMessage()]);
    exit();
}

$accion = $_GET['accion'] ?? $_POST['accion'] ?? '';

header('Content-Type: application/json');

switch ($accion) {
    case 'obtener_tareas_asignadas':
        obtenerTareasAsignadas($rut_empleado);
        break;
    case 'obtener_tarea_detalle':
        obtenerTareaDetalle($rut_empleado);
        break;
    case 'actualizar_estado':
        actualizarEstadoTarea($rut_empleado);
        break;
    case 'obtener_historial':
        obtenerHistorialTareas($rut_empleado);
        break;
    case 'marcar_completada':
        marcarTareaCompletada($rut_empleado);
        break;
    default:
        echo json_encode(['error' => 'Acción no válida']);
}

// Función para obtener tareas asignadas al empleado
function obtenerTareasAsignadas($rut_empleado) {
    global $pdo;
    
    try {
        $estado = $_GET['estado'] ?? 'todos';
        $pagina = max(1, intval($_GET['pagina'] ?? 1));
        $porPagina = intval($_GET['por_pagina'] ?? 10);
        $offset = ($pagina - 1) * $porPagina;
        
        // Construir WHERE dinámico
        $where = "WHERE t.persona_id = :rut_empleado";
        $params = [':rut_empleado' => $rut_empleado];
        
        if ($estado !== 'todos') {
            $where .= " AND o.estado = :estado";
            $params[':estado'] = $estado;
        }
        
        // Consulta para tareas asignadas
        $query = "
            SELECT 
                o.numero,
                o.fecha,
                o.descripcion,
                o.estado,
                o.vehiculo_id,
                v.color,
                per.nombre || ' ' || per.apellido AS cliente_nombre,
                ma.nombre AS marca,
                mo.nombre AS modelo,
                STRING_AGG(DISTINCT av.nombre, ', ') AS averias,
                ae.fecha_agenda,
                ae.hora_inicio,
                ae.hora_fin
            FROM orden_trabajo o
            JOIN trabajar t ON o.numero = t.orden_trabajo_id
            JOIN vehiculo v ON o.vehiculo_id = v.patente
            JOIN persona per ON v.persona_rut = per.rut
            LEFT JOIN tener te ON v.patente = te.vehiculo_id
            LEFT JOIN modelo mo ON te.modelo_id = mo.codigo
            LEFT JOIN marca ma ON mo.marca_id = ma.codigo
            LEFT JOIN orden_averia oa ON o.numero = oa.orden_trabajo_numero
            LEFT JOIN averia av ON oa.averia_id = av.codigo
            LEFT JOIN agenda_empleado ae 
                ON o.numero = ae.orden_trabajo_numero 
                AND ae.empleado_rut = t.persona_id
            WHERE t.persona_id = :rut_empleado
            GROUP BY 
                o.numero, o.fecha, o.descripcion, o.estado,
                o.vehiculo_id, v.color, per.nombre, per.apellido,
                ma.nombre, mo.nombre, ae.fecha_agenda, ae.hora_inicio, ae.hora_fin
            ORDER BY 
                CASE o.estado
                    WHEN 'Urgente' THEN 1
                    WHEN 'En Proceso' THEN 2
                    WHEN 'Pendiente' THEN 3
                    WHEN 'Completada' THEN 4
                    ELSE 5
                END,
                ae.fecha_agenda,
                ae.hora_inicio,
                o.numero DESC
            LIMIT :limit OFFSET :offset;";
        
        $stmt = $pdo->prepare($query);
        $params[':limit'] = $porPagina;
        $params[':offset'] = $offset;
        
        foreach ($params as $key => $value) {
            if ($key === ':limit' || $key === ':offset') {
                $stmt->bindValue($key, $value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue($key, $value);
            }
        }
        
        $stmt->execute();
        $tareas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Contar total
        $queryCount = "
            SELECT COUNT(DISTINCT o.numero)
            FROM orden_trabajo o
            JOIN trabajar t ON o.numero = t.orden_trabajo_id
            WHERE t.persona_id = :rut_empleado
        ";

        if ($estado !== 'todos') {
            $queryCount .= " AND o.estado = :estado";
        }

        $paramsCount = [
            ':rut_empleado' => $rut_empleado
        ];

        if ($estado !== 'todos') {
            $paramsCount[':estado'] = $estado;
        }

        $stmtCount = $pdo->prepare($queryCount);
        $stmtCount->execute($paramsCount);
        $total = $stmtCount->fetchColumn();

        
        echo json_encode([
            'success' => true,
            'tareas' => $tareas,
            'paginacion' => [
                'pagina' => $pagina,
                'por_pagina' => $porPagina,
                'total' => $total,
                'total_paginas' => ceil($total / $porPagina)
            ]
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => 'Error al obtener tareas: ' . $e->getMessage()
        ]);
    }
}

// Función para obtener detalle de una tarea específica
function obtenerTareaDetalle($rut_empleado) {
    global $pdo;
    
    try {
        $numero_tarea = $_GET['numero'] ?? 0;
        
        if (!$numero_tarea) {
            echo json_encode(['success' => false, 'message' => 'Número de tarea requerido']);
            return;
        }
        
        // Verificar que la tarea pertenezca al empleado
        $queryVerificar = "
            SELECT COUNT(*) 
            FROM trabajar 
            WHERE persona_id = :rut_empleado 
            AND orden_trabajo_id = :numero_tarea
        ";
        
        $stmtVerificar = $pdo->prepare($queryVerificar);
        $stmtVerificar->execute([
            ':rut_empleado' => $rut_empleado,
            ':numero_tarea' => $numero_tarea
        ]);
        
        if ($stmtVerificar->fetchColumn() == 0) {
            echo json_encode(['success' => false, 'message' => 'Tarea no asignada a este empleado']);
            return;
        }
        
        // Obtener detalles completos de la tarea
        $queryDetalle = "
            SELECT 
                o.numero,
                o.fecha,
                o.descripcion,
                o.estado,
                o.vehiculo_id,
                v.color,
                vin.anio,
                per.nombre || ' ' || per.apellido AS cliente_nombre,
                ma.nombre AS marca,
                mo.nombre AS modelo,
                tv.nombre AS tipo_vehiculo,
                ae.fecha_agenda,
                ae.hora_inicio,
                ae.hora_fin,
                STRING_AGG(DISTINCT av.nombre, ', ') AS averias
            FROM orden_trabajo o
            JOIN vehiculo v ON o.vehiculo_id = v.patente
            JOIN persona per ON v.persona_rut = per.rut
            LEFT JOIN vin ON v.patente = vin.vehiculo_id
            LEFT JOIN tener te ON v.patente = te.vehiculo_id
            LEFT JOIN modelo mo ON te.modelo_id = mo.codigo
            LEFT JOIN marca ma ON mo.marca_id = ma.codigo
            LEFT JOIN tipo_vehiculo tv ON te.tipo_vehiculo_id = tv.codigo
            LEFT JOIN agenda_empleado ae 
                ON o.numero = ae.orden_trabajo_numero
            LEFT JOIN orden_averia oa ON o.numero = oa.orden_trabajo_numero
            LEFT JOIN averia av ON oa.averia_id = av.codigo
            WHERE o.numero = :numero_tarea
            GROUP BY 
                o.numero, o.fecha, o.descripcion, o.estado,
                o.vehiculo_id, v.color, vin.anio,
                per.nombre, per.apellido,
                ma.nombre, mo.nombre, tv.nombre,
                ae.fecha_agenda, ae.hora_inicio, ae.hora_fin;";
        
        $stmtDetalle = $pdo->prepare($queryDetalle);
        $stmtDetalle->execute([':numero_tarea' => $numero_tarea]);
        $tarea = $stmtDetalle->fetch(PDO::FETCH_ASSOC);
        
        if (!$tarea) {
            echo json_encode(['success' => false, 'message' => 'Tarea no encontrada']);
            return;
        }
        
        // Obtener repuestos utilizados
        $queryRepuestos = "
            SELECT 
                p.codigo,
                p.nombre,
                hr.cantidad_instalada,
                hr.costo_unitario,
                (hr.cantidad_instalada * hr.costo_unitario) AS subtotal
            FROM historial_repuestos_vehiculo hr
            JOIN pieza p ON hr.repuesto_codigo = p.codigo
            WHERE hr.orden_trabajo_numero = :numero_tarea;
        ";
        
        $stmtRepuestos = $pdo->prepare($queryRepuestos);
        $stmtRepuestos->execute([':numero_tarea' => $numero_tarea]);
        $repuestos = $stmtRepuestos->fetchAll(PDO::FETCH_ASSOC);
        
        // Calcular total de repuestos
        $total_repuestos = array_sum(array_column($repuestos, 'subtotal'));
        
        echo json_encode([
            'success' => true,
            'tarea' => $tarea,
            'repuestos' => $repuestos,
            'total_repuestos' => $total_repuestos
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => 'Error al obtener detalles: ' . $e->getMessage()
        ]);
    }
}

// Función para actualizar estado de tarea
function actualizarEstadoTarea($rut_empleado) {
    global $pdo;
    
    try {
        $numero_tarea = $_POST['numero_tarea'] ?? 0;
        $nuevo_estado = $_POST['estado'] ?? '';
        $observaciones = $_POST['observaciones'] ?? '';
        
        if (!$numero_tarea || !$nuevo_estado) {
            echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
            return;
        }
        
        // Verificar que la tarea pertenezca al empleado
        $queryVerificar = "
            SELECT COUNT(*) 
            FROM trabajar 
            WHERE persona_id = :rut_empleado 
            AND orden_trabajo_id = :numero_tarea
        ";
        
        $stmtVerificar = $pdo->prepare($queryVerificar);
        $stmtVerificar->execute([
            ':rut_empleado' => $rut_empleado,
            ':numero_tarea' => $numero_tarea
        ]);
        
        if ($stmtVerificar->fetchColumn() == 0) {
            echo json_encode(['success' => false, 'message' => 'No autorizado para modificar esta tarea']);
            return;
        }
        
        // Actualizar estado
        $queryActualizar = "
            UPDATE orden_trabajo 
            SET estado = :estado
            WHERE numero = :numero_tarea
            RETURNING *
        ";
        
        $stmtActualizar = $pdo->prepare($queryActualizar);
        $stmtActualizar->execute([
            ':estado' => $nuevo_estado,
            ':numero_tarea' => $numero_tarea
        ]);
        
        // Registrar historial si hay observaciones
        if ($observaciones) {
            $queryHistorial = "
                INSERT INTO historial_tareas (
                    orden_trabajo_numero,
                    empleado_rut,
                    estado_anterior,
                    estado_nuevo,
                    observaciones
                ) VALUES (
                    :numero_tarea,
                    :rut_empleado,
                    (SELECT estado FROM orden_trabajo WHERE numero = :numero_tarea_old),
                    :nuevo_estado,
                    :observaciones
                )
            ";
            
            $stmtHistorial = $pdo->prepare($queryHistorial);
            $stmtHistorial->execute([
                ':numero_tarea' => $numero_tarea,
                ':numero_tarea_old' => $numero_tarea,
                ':rut_empleado' => $rut_empleado,
                ':nuevo_estado' => $nuevo_estado,
                ':observaciones' => $observaciones
            ]);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Estado actualizado correctamente',
            'nuevo_estado' => $nuevo_estado
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => 'Error al actualizar estado: ' . $e->getMessage()
        ]);
    }
}

// Función para marcar tarea como completada
function marcarTareaCompletada($rut_empleado) {
    global $pdo;
    
    try {
        $numero_tarea = $_POST['numero_tarea'] ?? 0;
        $tiempo_empleado = $_POST['tiempo_empleado'] ?? '';
        $observaciones_finales = $_POST['observaciones_finales'] ?? '';
        
        if (!$numero_tarea) {
            echo json_encode(['success' => false, 'message' => 'Número de tarea requerido']);
            return;
        }
        
        // Verificar que la tarea pertenezca al empleado
        $queryVerificar = "
            SELECT COUNT(*) 
            FROM trabajar 
            WHERE persona_id = :rut_empleado 
            AND orden_trabajo_id = :numero_tarea
        ";
        
        $stmtVerificar = $pdo->prepare($queryVerificar);
        $stmtVerificar->execute([
            ':rut_empleado' => $rut_empleado,
            ':numero_tarea' => $numero_tarea
        ]);
        
        if ($stmtVerificar->fetchColumn() == 0) {
            echo json_encode(['success' => false, 'message' => 'No autorizado para completar esta tarea']);
            return;
        }
        
        $pdo->beginTransaction();
        
        // Actualizar estado a completada
        $queryCompletar = "
            UPDATE orden_trabajo 
            SET estado = 'Completada'
            WHERE numero = :numero_tarea
            RETURNING *
        ";
        
        $stmtCompletar = $pdo->prepare($queryCompletar);
        $stmtCompletar->execute([':numero_tarea' => $numero_tarea]);
        
        // Registrar tiempo empleado si se proporciona
        if ($tiempo_empleado) {
            $queryTiempo = "
                UPDATE agenda_empleado 
                SET tiempo_real = :tiempo_empleado
                WHERE orden_trabajo_numero = :numero_tarea
            ";
            
            $stmtTiempo = $pdo->prepare($queryTiempo);
            $stmtTiempo->execute([
                ':tiempo_empleado' => $tiempo_empleado,
                ':numero_tarea' => $numero_tarea
            ]);
        }
        
        // Registrar finalización
        $queryFinalizacion = "
            INSERT INTO historial_completacion_tareas (
                orden_trabajo_numero,
                empleado_rut,
                fecha_completacion,
                tiempo_empleado,
                observaciones
            ) VALUES (
                :numero_tarea,
                :rut_empleado,
                CURRENT_TIMESTAMP,
                :tiempo_empleado,
                :observaciones_finales
            )
        ";
        
        $stmtFinalizacion = $pdo->prepare($queryFinalizacion);
        $stmtFinalizacion->execute([
            ':numero_tarea' => $numero_tarea,
            ':rut_empleado' => $rut_empleado,
            ':tiempo_empleado' => $tiempo_empleado,
            ':observaciones_finales' => $observaciones_finales
        ]);
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Tarea marcada como completada',
            'numero_tarea' => $numero_tarea
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode([
            'success' => false,
            'error' => 'Error al completar tarea: ' . $e->getMessage()
        ]);
    }
}

// Función para obtener historial de tareas del empleado
function obtenerHistorialTareas($rut_empleado) {
    global $pdo;
    
    try {
        $fecha_inicio = $_GET['fecha_inicio'] ?? date('Y-m-d', strtotime('-30 days'));
        $fecha_fin = $_GET['fecha_fin'] ?? date('Y-m-d');
        
        $query = "
            SELECT 
                o.numero,
                o.fecha,
                o.descripcion,
                o.estado,
                o.vehiculo_id,
                v.color,
                per.nombre || ' ' || per.apellido AS cliente_nombre,
                hct.fecha_completacion,
                hct.tiempo_empleado,
                hct.observaciones
            FROM orden_trabajo o
            JOIN trabajar t ON o.numero = t.orden_trabajo_id
            JOIN vehiculo v ON o.vehiculo_id = v.patente
            JOIN persona per ON v.persona_rut = per.rut
            JOIN historial_completacion_tareas hct 
                ON o.numero = hct.orden_trabajo_numero
            WHERE t.persona_id = :rut_empleado
            AND o.estado = 'Completada'
            AND hct.fecha_completacion 
                BETWEEN :fecha_inicio AND :fecha_fin
            ORDER BY hct.fecha_completacion DESC;
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            ':rut_empleado' => $rut_empleado,
            ':fecha_inicio' => $fecha_inicio . ' 00:00:00',
            ':fecha_fin' => $fecha_fin . ' 23:59:59'
        ]);
        
        $historial = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'historial' => $historial,
            'periodo' => [
                'fecha_inicio' => $fecha_inicio,
                'fecha_fin' => $fecha_fin
            ]
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => 'Error al obtener historial: ' . $e->getMessage()
        ]);
    }
}
?>