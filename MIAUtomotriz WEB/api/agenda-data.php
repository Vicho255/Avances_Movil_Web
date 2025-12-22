<?php
// api/agenda-data.php
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
    case 'get_semana':
        getAgendaSemana($rut_empleado);
        break;
    case 'get_ordenes_disponibles':
        getOrdenesDisponibles($rut_empleado);
        break;
    case 'asignar_orden':
        asignarOrdenAgenda($rut_empleado);
        break;
    case 'get_detalles_orden':
        getDetallesOrden($rut_empleado);
        break;
    case 'actualizar_agenda':
        actualizarAgendaOrden($rut_empleado);
        break;
    default:
        echo json_encode(['error' => 'Acción no válida']);
}

// Obtener agenda de la semana
function getAgendaSemana($rut_empleado) {
    global $pdo;
    
    try {
        $fecha_inicio = $_GET['fecha_inicio'] ?? date('Y-m-d', strtotime('monday this week'));
        $fecha_fin = $_GET['fecha_fin'] ?? date('Y-m-d', strtotime('sunday this week'));
        
        // Crear array de días de la semana
        $fecha_actual = new DateTime($fecha_inicio);
        $fecha_fin_obj = new DateTime($fecha_fin);
        $calendario = [];
        
        while ($fecha_actual <= $fecha_fin_obj) {
            $fecha_str = $fecha_actual->format('Y-m-d');
            $dia_semana = $fecha_actual->format('N'); // 1=lunes, 7=domingo
            
            // Obtener órdenes para este día
            $query = "
                SELECT 
                    o.numero,
                    o.descripcion,
                    o.estado,
                    o.vehiculo_id,
                    ae.hora_inicio,
                    ae.hora_fin,
                    p.nombre || ' ' || p.apellido as cliente_nombre,
                    ma.nombre as marca,
                    mo.nombre as modelo
                FROM agenda_empleado ae
                JOIN orden_trabajo o ON ae.orden_trabajo_numero = o.numero
                JOIN trabajar t ON o.numero = t.orden_trabajo_id
                LEFT JOIN vehiculo v ON o.vehiculo_id = v.patente
                LEFT JOIN persona p ON v.persona_rut = p.rut
                LEFT JOIN tener te ON v.patente = te.vehiculo_id
                LEFT JOIN modelo mo ON te.modelo_id = mo.codigo
                LEFT JOIN marca ma ON mo.marca_id = ma.codigo
                WHERE t.persona_id = :rut_empleado
                AND ae.fecha_agenda = :fecha
                AND o.estado != 'Completada'
                ORDER BY ae.hora_inicio ASC
            ";
            
            $stmt = $pdo->prepare($query);
            $stmt->execute([
                ':rut_empleado' => $rut_empleado,
                ':fecha' => $fecha_str
            ]);
            
            $ordenes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $calendario[] = [
                'fecha' => $fecha_str,
                'dia_semana' => $dia_semana,
                'dia_nombre' => getNombreDia($dia_semana),
                'numero_dia' => $fecha_actual->format('d'),
                'ordenes' => $ordenes
            ];
            
            $fecha_actual->modify('+1 day');
        }
        
        echo json_encode([
            'success' => true,
            'calendario' => $calendario,
            'rango' => [
                'fecha_inicio' => $fecha_inicio,
                'fecha_fin' => $fecha_fin
            ]
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => 'Error al obtener agenda: ' . $e->getMessage()
        ]);
    }
}

// Obtener órdenes disponibles para asignar
function getOrdenesDisponibles($rut_empleado) {
    global $pdo;
    
    try {
        $query = "
            SELECT 
                o.numero,
                o.fecha,
                o.descripcion,
                o.estado,
                o.vehiculo_id,
                v.color,
                p.nombre || ' ' || p.apellido as cliente_nombre,
                ma.nombre as marca,
                mo.nombre as modelo,
                STRING_AGG(DISTINCT av.nombre, ', ') as averias
            FROM orden_trabajo o
            LEFT JOIN vehiculo v ON o.vehiculo_id = v.patente
            LEFT JOIN persona p ON v.persona_rut = p.rut
            LEFT JOIN tener te ON v.patente = te.vehiculo_id
            LEFT JOIN modelo mo ON te.modelo_id = mo.codigo
            LEFT JOIN marca ma ON mo.marca_id = ma.codigo
            LEFT JOIN orden_averia oa ON o.numero = oa.orden_trabajo_numero
            LEFT JOIN averia av ON oa.averia_id = av.codigo
            WHERE o.numero NOT IN (
                SELECT orden_trabajo_numero 
                FROM agenda_empleado 
                WHERE orden_trabajo_numero IS NOT NULL
            )
            AND o.numero NOT IN (
                SELECT orden_trabajo_id 
                FROM trabajar 
                WHERE persona_id = :rut_empleado
            )
            AND o.estado IN ('Pendiente', 'Urgente')
            GROUP BY o.numero, o.fecha, o.descripcion, o.estado, 
                     o.vehiculo_id, v.color, p.nombre, p.apellido, 
                     ma.nombre, mo.nombre
            ORDER BY 
                CASE o.estado 
                    WHEN 'Urgente' THEN 1
                    WHEN 'Pendiente' THEN 2
                    ELSE 3
                END,
                o.fecha ASC
            LIMIT 20
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([':rut_empleado' => $rut_empleado]);
        $ordenes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'ordenes_disponibles' => $ordenes
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => 'Error al obtener órdenes disponibles: ' . $e->getMessage()
        ]);
    }
}

// Asignar orden a la agenda
function asignarOrdenAgenda($rut_empleado) {
    global $pdo;
    
    try {
        $orden_numero = $_POST['orden_numero'] ?? 0;
        $fecha_agenda = $_POST['fecha_agenda'] ?? '';
        $hora_inicio = $_POST['hora_inicio'] ?? '';
        $hora_fin = $_POST['hora_fin'] ?? '';
        $observaciones = $_POST['observaciones'] ?? '';
        
        if (!$orden_numero || !$fecha_agenda || !$hora_inicio) {
            echo json_encode([
                'success' => false,
                'message' => 'Datos incompletos'
            ]);
            return;
        }
        
        $pdo->beginTransaction();
        
        // 1. Verificar que la orden existe y está disponible
        $queryVerificar = "
            SELECT COUNT(*) 
            FROM orden_trabajo 
            WHERE numero = :orden_numero
            AND estado IN ('Pendiente', 'Urgente')
            AND numero NOT IN (
                SELECT orden_trabajo_numero 
                FROM agenda_empleado 
                WHERE orden_trabajo_numero IS NOT NULL
            )
        ";
        
        $stmtVerificar = $pdo->prepare($queryVerificar);
        $stmtVerificar->execute([':orden_numero' => $orden_numero]);
        
        if ($stmtVerificar->fetchColumn() == 0) {
            $pdo->rollBack();
            echo json_encode([
                'success' => false,
                'message' => 'Orden no disponible o ya asignada'
            ]);
            return;
        }
        
        // 2. Asignar empleado a la orden
        $queryAsignar = "
            INSERT INTO trabajar (persona_id, orden_trabajo_id) 
            VALUES (:rut_empleado, :orden_numero)
            ON CONFLICT DO NOTHING
        ";
        
        $stmtAsignar = $pdo->prepare($queryAsignar);
        $stmtAsignar->execute([
            ':rut_empleado' => $rut_empleado,
            ':orden_numero' => $orden_numero
        ]);
        
        // 3. Agregar a agenda
        $queryAgenda = "
            INSERT INTO agenda_empleado (
                orden_trabajo_numero,
                fecha_agenda,
                hora_inicio,
                hora_fin,
                observaciones
            ) VALUES (
                :orden_numero,
                :fecha_agenda,
                :hora_inicio,
                :hora_fin,
                :observaciones
            )
        ";
        
        $stmtAgenda = $pdo->prepare($queryAgenda);
        $stmtAgenda->execute([
            ':orden_numero' => $orden_numero,
            ':fecha_agenda' => $fecha_agenda,
            ':hora_inicio' => $hora_inicio,
            ':hora_fin' => $hora_fin,
            ':observaciones' => $observaciones
        ]);
        
        // 4. Actualizar estado de la orden
        $queryEstado = "
            UPDATE orden_trabajo 
            SET estado = 'En Proceso'
            WHERE numero = :orden_numero
        ";
        
        $stmtEstado = $pdo->prepare($queryEstado);
        $stmtEstado->execute([':orden_numero' => $orden_numero]);
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Orden asignada exitosamente a tu agenda',
            'orden_numero' => $orden_numero
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode([
            'success' => false,
            'error' => 'Error al asignar orden: ' . $e->getMessage()
        ]);
    }
}

// Obtener detalles de una orden
function getDetallesOrden($rut_empleado) {
    global $pdo;
    
    try {
        $orden_numero = $_GET['orden_numero'] ?? 0;
        
        if (!$orden_numero) {
            echo json_encode([
                'success' => false,
                'message' => 'Número de orden requerido'
            ]);
            return;
        }
        
        // Verificar que el empleado tenga acceso
        $queryVerificar = "
            SELECT COUNT(*) 
            FROM trabajar 
            WHERE persona_id = :rut_empleado
            AND orden_trabajo_id = :orden_numero
        ";
        
        $stmtVerificar = $pdo->prepare($queryVerificar);
        $stmtVerificar->execute([
            ':rut_empleado' => $rut_empleado,
            ':orden_numero' => $orden_numero
        ]);
        
        if ($stmtVerificar->fetchColumn() == 0) {
            echo json_encode([
                'success' => false,
                'message' => 'No tienes acceso a esta orden'
            ]);
            return;
        }
        
        $query = "
            SELECT 
                o.*,
                v.*,
                p.nombre || ' ' || p.apellido as cliente_nombre,
                p.telefono as cliente_telefono,
                p.email as cliente_email,
                ma.nombre as marca,
                mo.nombre as modelo,
                tv.nombre as tipo_vehiculo,
                ae.fecha_agenda,
                ae.hora_inicio,
                ae.hora_fin,
                ae.observaciones as agenda_observaciones,
                STRING_AGG(DISTINCT av.nombre, ', ') as averias
            FROM orden_trabajo o
            LEFT JOIN vehiculo v ON o.vehiculo_id = v.patente
            LEFT JOIN persona p ON v.persona_rut = p.rut
            LEFT JOIN tener te ON v.patente = te.vehiculo_id
            LEFT JOIN modelo mo ON te.modelo_id = mo.codigo
            LEFT JOIN marca ma ON mo.marca_id = ma.codigo
            LEFT JOIN tipo_vehiculo tv ON te.tipo_vehiculo_id = tv.codigo
            LEFT JOIN agenda_empleado ae ON o.numero = ae.orden_trabajo_numero
            LEFT JOIN orden_averia oa ON o.numero = oa.orden_trabajo_numero
            LEFT JOIN averia av ON oa.averia_id = av.codigo
            WHERE o.numero = :orden_numero
            GROUP BY o.numero, o.fecha, o.descripcion, o.estado, 
                     o.vehiculo_id, v.*, p.nombre, p.apellido, 
                     p.telefono, p.email, ma.nombre, mo.nombre, 
                     tv.nombre, ae.fecha_agenda, ae.hora_inicio, 
                     ae.hora_fin, ae.observaciones
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([':orden_numero' => $orden_numero]);
        $orden = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$orden) {
            echo json_encode([
                'success' => false,
                'message' => 'Orden no encontrada'
            ]);
            return;
        }
        
        // Obtener repuestos
        $queryRepuestos = "
            SELECT 
                p.codigo,
                p.nombre,
                hr.cantidad_instalada,
                hr.costo_unitario
            FROM historial_repuestos_vehiculo hr
            LEFT JOIN pieza p ON hr.repuesto_codigo = p.codigo
            WHERE hr.orden_trabajo_numero = :orden_numero
        ";
        
        $stmtRepuestos = $pdo->prepare($queryRepuestos);
        $stmtRepuestos->execute([':orden_numero' => $orden_numero]);
        $repuestos = $stmtRepuestos->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'orden' => $orden,
            'repuestos' => $repuestos
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => 'Error al obtener detalles: ' . $e->getMessage()
        ]);
    }
}

// Actualizar agenda de una orden
function actualizarAgendaOrden($rut_empleado) {
    global $pdo;
    
    try {
        $orden_numero = $_POST['orden_numero'] ?? 0;
        $fecha_agenda = $_POST['fecha_agenda'] ?? '';
        $hora_inicio = $_POST['hora_inicio'] ?? '';
        $hora_fin = $_POST['hora_fin'] ?? '';
        $observaciones = $_POST['observaciones'] ?? '';
        
        if (!$orden_numero) {
            echo json_encode([
                'success' => false,
                'message' => 'Número de orden requerido'
            ]);
            return;
        }
        
        // Verificar que el empleado tenga acceso
        $queryVerificar = "
            SELECT COUNT(*) 
            FROM trabajar 
            WHERE persona_id = :rut_empleado
            AND orden_trabajo_id = :orden_numero
        ";
        
        $stmtVerificar = $pdo->prepare($queryVerificar);
        $stmtVerificar->execute([
            ':rut_empleado' => $rut_empleado,
            ':orden_numero' => $orden_numero
        ]);
        
        if ($stmtVerificar->fetchColumn() == 0) {
            echo json_encode([
                'success' => false,
                'message' => 'No tienes permiso para modificar esta orden'
            ]);
            return;
        }
        
        // Actualizar agenda
        $query = "
            UPDATE agenda_empleado 
            SET fecha_agenda = COALESCE(:fecha_agenda, fecha_agenda),
                hora_inicio = COALESCE(:hora_inicio, hora_inicio),
                hora_fin = COALESCE(:hora_fin, hora_fin),
                observaciones = COALESCE(:observaciones, observaciones)
            WHERE orden_trabajo_numero = :orden_numero
            RETURNING *
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            ':orden_numero' => $orden_numero,
            ':fecha_agenda' => $fecha_agenda ?: null,
            ':hora_inicio' => $hora_inicio ?: null,
            ':hora_fin' => $hora_fin ?: null,
            ':observaciones' => $observaciones ?: null
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Agenda actualizada exitosamente'
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => 'Error al actualizar agenda: ' . $e->getMessage()
        ]);
    }
}

// Función auxiliar para nombre del día
function getNombreDia($numero) {
    $dias = [
        1 => 'Lun',
        2 => 'Mar',
        3 => 'Mié',
        4 => 'Jue',
        5 => 'Vie',
        6 => 'Sáb',
        7 => 'Dom'
    ];
    return $dias[$numero] ?? 'Día';
}
?>