<?php
// api/dashboard-data.php
session_start();

// Verificar sesión de empleado
if (!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== TRUE || $_SESSION['tipo_persona'] !== 'Empleado') {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'No autorizado', 'redirect' => 'login.php']);
    exit();
}

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
    case 'get_stats':
        getDashboardStats($rut_empleado);
        break;
    case 'get_tareas_hoy':
        getTareasHoy($rut_empleado);
        break;
    case 'get_agenda_hoy':
        getAgendaHoy($rut_empleado);
        break;
    case 'get_performance':
        getPerformanceMetrics($rut_empleado);
        break;
    default:
        echo json_encode(['error' => 'Acción no válida']);
}

// Obtener estadísticas del dashboard
function getDashboardStats($rut_empleado) {
    global $pdo;
    
    try {
        $hoy = date('Y-m-d');
        $inicio_mes = date('Y-m-01');
        
        // Tareas en progreso
        $queryProgreso = "
            SELECT COUNT(*) as count
            FROM orden_trabajo o
            JOIN trabajar t ON o.numero = t.orden_trabajo_id
            WHERE t.persona_id = :rut_empleado
            AND o.estado IN ('En Proceso', 'Urgente')
        ";
        
        $stmtProgreso = $pdo->prepare($queryProgreso);
        $stmtProgreso->execute([':rut_empleado' => $rut_empleado]);
        $en_progreso = $stmtProgreso->fetchColumn();
        
        // Tareas pendientes
        $queryPendientes = "
            SELECT COUNT(*) as count
            FROM orden_trabajo o
            JOIN trabajar t ON o.numero = t.orden_trabajo_id
            WHERE t.persona_id = :rut_empleado
            AND o.estado = 'Pendiente'
        ";
        
        $stmtPendientes = $pdo->prepare($queryPendientes);
        $stmtPendientes->execute([':rut_empleado' => $rut_empleado]);
        $pendientes = $stmtPendientes->fetchColumn();
        
        // Completados hoy
        $queryCompletadosHoy = "
            SELECT COUNT(*) as count
            FROM historial_completacion_tareas h
            WHERE h.empleado_rut = :rut_empleado
            AND DATE(h.fecha_completacion) = :hoy
        ";
        
        $stmtCompletadosHoy = $pdo->prepare($queryCompletadosHoy);
        $stmtCompletadosHoy->execute([
            ':rut_empleado' => $rut_empleado,
            ':hoy' => $hoy
        ]);
        $completados_hoy = $stmtCompletadosHoy->fetchColumn();
        
        // Tiempo promedio
        $queryTiempoPromedio = "
            SELECT COALESCE(AVG(
                EXTRACT(EPOCH FROM (hora_fin - hora_inicio)) / 3600
            ), 0) as tiempo_promedio
            FROM agenda_empleado ae
            JOIN trabajar t ON ae.orden_trabajo_numero = t.orden_trabajo_id
            WHERE t.persona_id = :rut_empleado
            AND ae.hora_fin IS NOT NULL
            AND ae.hora_inicio IS NOT NULL
        ";
        
        $stmtTiempo = $pdo->prepare($queryTiempoPromedio);
        $stmtTiempo->execute([':rut_empleado' => $rut_empleado]);
        $tiempo_promedio = $stmtTiempo->fetchColumn();
        
        echo json_encode([
            'success' => true,
            'stats' => [
                'en_progreso' => $en_progreso,
                'pendientes' => $pendientes,
                'completados_hoy' => $completados_hoy,
                'tiempo_promedio' => round($tiempo_promedio, 1)
            ]
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => 'Error al obtener estadísticas: ' . $e->getMessage()
        ]);
    }
}

// Obtener tareas para hoy
function getTareasHoy($rut_empleado) {
    global $pdo;
    
    try {
        $hoy = date('Y-m-d');
        
        $query = "
            SELECT 
                o.numero,
                o.descripcion,
                o.estado,
                o.vehiculo_id,
                v.color,
                p.nombre || ' ' || p.apellido as cliente_nombre,
                ae.hora_inicio,
                ae.hora_fin,
                ma.nombre as marca,
                mo.nombre as modelo,
                STRING_AGG(DISTINCT av.nombre, ', ') as averias
            FROM orden_trabajo o
            JOIN trabajar t ON o.numero = t.orden_trabajo_id
            LEFT JOIN vehiculo v ON o.vehiculo_id = v.patente
            LEFT JOIN persona p ON v.persona_rut = p.rut
            LEFT JOIN tener te ON v.patente = te.vehiculo_id
            LEFT JOIN modelo mo ON te.modelo_id = mo.codigo
            LEFT JOIN marca ma ON mo.marca_id = ma.codigo
            LEFT JOIN orden_averia oa ON o.numero = oa.orden_trabajo_numero
            LEFT JOIN averia av ON oa.averia_id = av.codigo
            LEFT JOIN agenda_empleado ae ON o.numero = ae.orden_trabajo_numero
            WHERE t.persona_id = :rut_empleado
            AND o.estado IN ('En Proceso', 'Urgente', 'Pendiente')
            AND (ae.fecha_agenda = :hoy OR ae.fecha_agenda IS NULL)
            GROUP BY o.numero, o.descripcion, o.estado, o.vehiculo_id, 
                     v.color, p.nombre, p.apellido, ae.hora_inicio, 
                     ae.hora_fin, ma.nombre, mo.nombre
            ORDER BY 
                CASE o.estado 
                    WHEN 'Urgente' THEN 1
                    WHEN 'En Proceso' THEN 2
                    WHEN 'Pendiente' THEN 3
                    ELSE 4
                END,
                ae.hora_inicio ASC
            LIMIT 5
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            ':rut_empleado' => $rut_empleado,
            ':hoy' => $hoy
        ]);
        
        $tareas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'tareas' => $tareas
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => 'Error al obtener tareas: ' . $e->getMessage()
        ]);
    }
}

// Obtener agenda para hoy
function getAgendaHoy($rut_empleado) {
    global $pdo;
    
    try {
        $hoy = date('Y-m-d');
        
        $query = "
            SELECT 
                ae.hora_inicio,
                ae.hora_fin,
                o.numero,
                o.descripcion,
                o.vehiculo_id,
                p.nombre || ' ' || p.apellido as cliente_nombre,
                ae.observaciones,
                'appointment' as tipo
            FROM agenda_empleado ae
            JOIN orden_trabajo o ON ae.orden_trabajo_numero = o.numero
            JOIN trabajar t ON o.numero = t.orden_trabajo_id
            LEFT JOIN vehiculo v ON o.vehiculo_id = v.patente
            LEFT JOIN persona p ON v.persona_rut = p.rut
            WHERE t.persona_id = :rut_empleado
            AND ae.fecha_agenda = :hoy
            AND o.estado != 'Completada'
            ORDER BY ae.hora_inicio ASC
            
            UNION ALL
            
            SELECT 
                '08:00:00' as hora_inicio,
                NULL as hora_fin,
                NULL as numero,
                'Inicio de Turno' as descripcion,
                NULL as vehiculo_id,
                NULL as cliente_nombre,
                'Registro de entrada' as observaciones,
                'schedule' as tipo
            FROM dual
            
            UNION ALL
            
            SELECT 
                '12:00:00' as hora_inicio,
                '13:00:00' as hora_fin,
                NULL as numero,
                'Descanso' as descripcion,
                NULL as vehiculo_id,
                NULL as cliente_nombre,
                'Almuerzo' as observaciones,
                'break' as tipo
            FROM dual
            
            UNION ALL
            
            SELECT 
                '17:00:00' as hora_inicio,
                NULL as hora_fin,
                NULL as numero,
                'Fin de Turno' as descripcion,
                NULL as vehiculo_id,
                NULL as cliente_nombre,
                'Registro de salida' as observaciones,
                'schedule' as tipo
            FROM dual
            
            ORDER BY hora_inicio
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            ':rut_empleado' => $rut_empleado,
            ':hoy' => $hoy
        ]);
        
        $agenda = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'agenda' => $agenda
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => 'Error al obtener agenda: ' . $e->getMessage()
        ]);
    }
}

// Obtener métricas de rendimiento
function getPerformanceMetrics($rut_empleado) {
    global $pdo;
    
    try {
        $inicio_semana = date('Y-m-d', strtotime('monday this week'));
        $inicio_mes = date('Y-m-01');
        
        // Eficiencia (tareas completadas / tareas asignadas)
        $queryEficiencia = "
            SELECT 
                COALESCE((
                    SELECT COUNT(*) 
                    FROM historial_completacion_tareas 
                    WHERE empleado_rut = :rut_empleado
                    AND DATE(fecha_completacion) >= :inicio_semana
                ) * 100.0 / NULLIF(
                    SELECT COUNT(*) 
                    FROM trabajar t
                    JOIN orden_trabajo o ON t.orden_trabajo_id = o.numero
                    WHERE t.persona_id = :rut_empleado2
                    AND o.fecha >= :inicio_semana2
                , 0), 100) as eficiencia
            FROM dual
        ";
        
        $stmtEficiencia = $pdo->prepare($queryEficiencia);
        $stmtEficiencia->execute([
            ':rut_empleado' => $rut_empleado,
            ':rut_empleado2' => $rut_empleado,
            ':inicio_semana' => $inicio_semana,
            ':inicio_semana2' => $inicio_semana
        ]);
        $eficiencia = $stmtEficiencia->fetchColumn();
        
        // Tiempo promedio
        $queryTiempo = "
            SELECT COALESCE(AVG(
                EXTRACT(EPOCH FROM (hora_fin - hora_inicio)) / 3600
            ), 0) as tiempo_promedio
            FROM agenda_empleado ae
            JOIN trabajar t ON ae.orden_trabajo_numero = t.orden_trabajo_id
            WHERE t.persona_id = :rut_empleado
            AND ae.hora_fin IS NOT NULL
            AND ae.fecha_agenda >= :inicio_semana
        ";
        
        $stmtTiempo = $pdo->prepare($queryTiempo);
        $stmtTiempo->execute([
            ':rut_empleado' => $rut_empleado,
            ':inicio_semana' => $inicio_semana
        ]);
        $tiempo_promedio = $stmtTiempo->fetchColumn();
        
        // Tareas por día
        $queryTareasDia = "
            SELECT COALESCE(AVG(tareas_dia), 0) as tareas_dia
            FROM (
                SELECT DATE(fecha_completacion) as dia, COUNT(*) as tareas_dia
                FROM historial_completacion_tareas
                WHERE empleado_rut = :rut_empleado
                AND fecha_completacion >= :inicio_mes
                GROUP BY DATE(fecha_completacion)
            ) t
        ";
        
        $stmtTareasDia = $pdo->prepare($queryTareasDia);
        $stmtTareasDia->execute([
            ':rut_empleado' => $rut_empleado,
            ':inicio_mes' => $inicio_mes
        ]);
        $tareas_dia = $stmtTareasDia->fetchColumn();
        
        // Reclamos (tareas con observaciones negativas)
        $queryReclamos = "
            SELECT COUNT(*) as reclamos
            FROM historial_completacion_tareas
            WHERE empleado_rut = :rut_empleado
            AND observaciones ILIKE '%problema%' 
            OR observaciones ILIKE '%error%'
            OR observaciones ILIKE '%falla%'
            AND fecha_completacion >= :inicio_mes
        ";
        
        $stmtReclamos = $pdo->prepare($queryReclamos);
        $stmtReclamos->execute([
            ':rut_empleado' => $rut_empleado,
            ':inicio_mes' => $inicio_mes
        ]);
        $reclamos = $stmtReclamos->fetchColumn();
        
        echo json_encode([
            'success' => true,
            'metrics' => [
                'eficiencia' => round($eficiencia),
                'tiempo_promedio' => round($tiempo_promedio, 1),
                'tareas_dia' => round($tareas_dia),
                'reclamos' => $reclamos
            ]
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => 'Error al obtener métricas: ' . $e->getMessage()
        ]);
    }
}
?>