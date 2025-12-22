<?php
// api/dashboard-data.php
session_start();
require_once '../config/database.php';  // Ajusta la ruta según la ubicación de tu database.php

// Verificar que el usuario sea administrador
if (!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== TRUE || $_SESSION['tipo_persona'] !== 'Administrador') {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'No autorizado']);
    exit();
}

// Conexión a la base de datos usando tu clase Database
try {
    $pdo = getDB();  // Usar tu función helper existente
} catch (Exception $e) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Error de conexión a la base de datos']);
    exit();
}

// Determinar qué datos se solicitan
$tipo = $_GET['tipo'] ?? 'todos';

header('Content-Type: application/json');

try {
    switch ($tipo) {
        case 'ingresos_mensuales':
            echo json_encode(getIngresosMensuales($pdo));
            break;
        case 'clientes_nuevos':
            echo json_encode(getClientesNuevos($pdo));
            break;
        case 'repuestos_mas_usados':
            echo json_encode(getRepuestosMasUsados($pdo));
            break;
        case 'averias_mas_comunes':
            echo json_encode(getAveriasMasComunes($pdo));
            break;
        case 'estadisticas_generales':
            echo json_encode(getEstadisticasGenerales($pdo));
            break;
        default:
            echo json_encode([
                'ingresos_mensuales' => getIngresosMensuales($pdo),
                'clientes_nuevos' => getClientesNuevos($pdo),
                'repuestos_mas_usados' => getRepuestosMasUsados($pdo),
                'averias_mas_comunes' => getAveriasMasComunes($pdo),
                'estadisticas_generales' => getEstadisticasGenerales($pdo)
            ]);
    }
} catch (Exception $e) {
    echo json_encode(['error' => 'Error en el servidor']);
}

function getIngresosMensuales($pdo) {
    $anio_actual = date('Y');
    $query = "
        SELECT 
            EXTRACT(MONTH FROM f.fecha_emision) as mes,
            COALESCE(SUM(f.total), 0) as total
        FROM factura f
        WHERE EXTRACT(YEAR FROM f.fecha_emision) = :anio
        GROUP BY EXTRACT(MONTH FROM f.fecha_emision)
        ORDER BY mes
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute(['anio' => $anio_actual]);
    $resultados = $stmt->fetchAll();
    
    // Preparar datos para 12 meses
    $datos_meses = array_fill(1, 12, 0);
    $etiquetas = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    foreach ($resultados as $row) {
        $datos_meses[(int)$row['mes']] = (int)$row['total'];
    }
    
    return [
        'etiquetas' => $etiquetas,
        'datos' => array_values($datos_meses),
        'total_anual' => array_sum($datos_meses),
        'promedio_mensual' => count(array_filter($datos_meses)) > 0 ? 
            round(array_sum($datos_meses) / count(array_filter($datos_meses))) : 0
    ];
}

function getClientesNuevos($pdo) {
    // Últimos 7 días
    $query = "
        SELECT 
            DATE(p.fecha_registro) as fecha,
            COUNT(*) as cantidad
        FROM persona p
        WHERE p.fecha_registro >= CURRENT_DATE - INTERVAL '7 days'
            AND p.tipo_persona = 'Cliente'
        GROUP BY DATE(p.fecha_registro)
        ORDER BY fecha
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $resultados = $stmt->fetchAll();
    
    // Preparar datos para 7 días
    $etiquetas = [];
    $datos = [];
    
    for ($i = 6; $i >= 0; $i--) {
        $fecha = date('Y-m-d', strtotime("-$i days"));
        $dia_nombre = date('D', strtotime($fecha));
        
        // Traducir días al español
        $dias_es = [
            'Mon' => 'Lun', 'Tue' => 'Mar', 'Wed' => 'Mié',
            'Thu' => 'Jue', 'Fri' => 'Vie', 'Sat' => 'Sáb',
            'Sun' => 'Dom'
        ];
        
        $etiquetas[] = $dias_es[$dia_nombre];
        
        // Buscar datos para esta fecha
        $cantidad = 0;
        foreach ($resultados as $row) {
            if ($row['fecha'] == $fecha) {
                $cantidad = (int)$row['cantidad'];
                break;
            }
        }
        $datos[] = $cantidad;
    }
    
    return [
        'etiquetas' => $etiquetas,
        'datos' => $datos,
        'total_semanal' => array_sum($datos)
    ];
}

function getRepuestosMasUsados($pdo) {
    // Últimos 30 días
    $query = "
        SELECT 
            p.nombre,
            COALESCE(SUM(cp.cantidad), 0) as total_usado
        FROM pieza p
        LEFT JOIN cotizacion_pieza cp ON p.codigo = cp.pieza_codigo
        LEFT JOIN cotizacion c ON cp.cotizacion_id = c.numero
        WHERE c.fecha_emision >= CURRENT_DATE - INTERVAL '30 days'
            OR c.fecha_emision IS NULL
        GROUP BY p.codigo, p.nombre
        ORDER BY total_usado DESC
        LIMIT 6
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $resultados = $stmt->fetchAll();
    
    $etiquetas = [];
    $datos = [];
    $colores = ['#FF6384', '#36A2EB', '#4BC0C0', '#FFCE56', '#9966FF', '#FF9F40'];
    
    foreach ($resultados as $row) {
        $etiquetas[] = $row['nombre'];
        $datos[] = (int)$row['total_usado'];
    }
    
    // Si no hay suficientes datos, llenar con valores predeterminados
    $repuestos_predeterminados = [
        'Neumático' => 40,
        'Batería' => 25,
        'Filtro Aceite' => 15,
        'Pastillas Freno' => 10,
        'Aceite Motor' => 5,
        'Otros' => 5
    ];
    
    if (empty($etiquetas)) {
        foreach ($repuestos_predeterminados as $nombre => $valor) {
            $etiquetas[] = $nombre;
            $datos[] = $valor;
        }
    }
    
    return [
        'etiquetas' => $etiquetas,
        'datos' => $datos,
        'colores' => $colores
    ];
}

function getAveriasMasComunes($pdo) {
    // Últimos 60 días
    $query = "
        SELECT 
            a.nombre,
            COUNT(oa.averia_id) as frecuencia
        FROM averia a
        LEFT JOIN orden_averia oa ON a.codigo = oa.averia_id
        LEFT JOIN orden_trabajo o ON oa.orden_trabajo_numero = o.numero
        WHERE o.fecha >= CURRENT_DATE - INTERVAL '60 days'
            OR o.fecha IS NULL
        GROUP BY a.codigo, a.nombre
        ORDER BY frecuencia DESC
        LIMIT 6
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $resultados = $stmt->fetchAll();
    
    $etiquetas = [];
    $datos = [];
    $colores = ['#FF6384', '#36A2EB', '#4BC0C0', '#FFCE56', '#9966FF', '#FF9F40'];
    
    foreach ($resultados as $row) {
        $etiquetas[] = $row['nombre'];
        $datos[] = (int)$row['frecuencia'];
    }
    
    // Si no hay suficientes datos, llenar con valores predeterminados
    $averias_predeterminadas = [
        'Batería' => 30,
        'Frenos' => 25,
        'Llanta' => 20,
        'Vidrio' => 15,
        'Motor' => 5,
        'Otros' => 5
    ];
    
    if (empty($etiquetas)) {
        foreach ($averias_predeterminadas as $nombre => $valor) {
            $etiquetas[] = $nombre;
            $datos[] = $valor;
        }
    }
    
    return [
        'etiquetas' => $etiquetas,
        'datos' => $datos,
        'colores' => $colores
    ];
}

function getEstadisticasGenerales($pdo) {
    $estadisticas = [];
    
    // Total clientes
    $query_clientes = "SELECT COUNT(*) as total FROM persona WHERE tipo_persona = 'Cliente'";
    $stmt = $pdo->prepare($query_clientes);
    $stmt->execute();
    $estadisticas['clientes'] = (int)$stmt->fetchColumn();
    
    // Total vehículos
    $query_vehiculos = "SELECT COUNT(*) as total FROM vehiculo";
    $stmt = $pdo->prepare($query_vehiculos);
    $stmt->execute();
    $estadisticas['vehiculos'] = (int)$stmt->fetchColumn();
    
    // Servicios hoy
    $query_servicios_hoy = "SELECT COUNT(*) as total FROM orden_trabajo WHERE DATE(fecha) = CURRENT_DATE";
    $stmt = $pdo->prepare($query_servicios_hoy);
    $stmt->execute();
    $estadisticas['servicios_hoy'] = (int)$stmt->fetchColumn();
    
    // Ingresos del mes actual
    $query_ingresos_mes = "
        SELECT COALESCE(SUM(total), 0) as total 
        FROM factura 
        WHERE EXTRACT(MONTH FROM fecha_emision) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM fecha_emision) = EXTRACT(YEAR FROM CURRENT_DATE)
    ";
    $stmt = $pdo->prepare($query_ingresos_mes);
    $stmt->execute();
    $estadisticas['ingresos_mes'] = (int)$stmt->fetchColumn();
    
    return $estadisticas;
}
?>