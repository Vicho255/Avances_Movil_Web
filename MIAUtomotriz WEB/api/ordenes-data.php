<?php
// api/ordenes-data.php
session_start();

// Verificar sesión de administrador - COMENTADO PARA PRUEBAS
// if (!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== TRUE || $_SESSION['tipo_persona'] !== 'Administrador') {
//     header('Content-Type: application/json');
//     echo json_encode(['error' => 'No autorizado']);
//     exit();
// }

// Cargar la clase Database desde la raíz
require_once __DIR__ . '/../config/database.php';

// Obtener conexión usando tu función helper
try {
    $pdo = getDB();
} catch (Exception $e) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Error de conexión a la base de datos: ' . $e->getMessage()]);
    exit();
}

// Determinar acción
$accion = $_GET['accion'] ?? $_POST['accion'] ?? '';

header('Content-Type: application/json');

// Manejar la acción - SIN PARÁMETROS EN LAS LLAMADAS
switch ($accion) {
    case 'obtener_clientes':
        obtenerClientes();
        break;
    case 'obtener_vehiculos':
        obtenerVehiculos();
        break;
    case 'obtener_ordenes_cliente':
        obtenerOrdenesPorCliente();
        break;
    case 'obtener_trabajadores':
        obtenerTrabajadores();
        break;
    case 'obtener_averias':
        obtenerAverias();
        break;
    case 'obtener_repuestos':
        obtenerRepuestos();
        break;
    case 'crear_orden':
        crearOrdenTrabajo();
        break;
    case 'obtener_ordenes':
        obtenerOrdenesActivas();
        break;
    case 'obtener_detalles':
        obtenerDetallesOrden();
        break;
    case 'cambiar_estado':
        cambiarEstadoOrden();
        break;
    case 'obtener_cliente_info':
        obtenerClienteInfo();
        break;
    case 'obtener_vehiculo_info':
        obtenerVehiculoInfo();
        break;
    default:
        echo json_encode(['error' => 'Acción no válida: ' . $accion]);
}

// Funciones sin parámetros - usan variables globales

function obtenerClientes() {
    global $pdo;
    
    try {
        $query = "SELECT p.rut, p.nombre || ' ' || p.apellido as nombre_completo 
                  FROM persona p 
                  WHERE p.tipo_persona = 'Cliente' 
                  ORDER BY p.nombre, p.apellido";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $clientes = $stmt->fetchAll();
        
        echo json_encode($clientes);
    } catch (Exception $e) {
        echo json_encode(['error' => 'Error al obtener clientes: ' . $e->getMessage()]);
    }
}

function obtenerVehiculos() {
    global $pdo;
    
    try {
        $query = "SELECT v.patente, 
                         v.color,
                         p.nombre || ' ' || p.apellido as dueno,
                         COALESCE(m.nombre || ' ' || mo.nombre, 'Sin especificar') as modelo
                  FROM vehiculo v
                  LEFT JOIN persona p ON v.persona_rut = p.rut
                  LEFT JOIN tener t ON v.patente = t.vehiculo_id
                  LEFT JOIN modelo mo ON t.modelo_id = mo.codigo
                  LEFT JOIN marca m ON mo.marca_id = m.codigo
                  ORDER BY v.patente";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $vehiculos = $stmt->fetchAll();
        
        echo json_encode($vehiculos);
    } catch (Exception $e) {
        echo json_encode(['error' => 'Error al obtener vehículos: ' . $e->getMessage()]);
    }
}

function obtenerTrabajadores() {
    global $pdo;
    
    try {
        $query = "SELECT p.rut, p.nombre || ' ' || p.apellido as nombre_completo 
                  FROM persona p 
                  WHERE p.tipo_persona IN ('Empleado', 'Administrador')
                  ORDER BY p.nombre, p.apellido";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $trabajadores = $stmt->fetchAll();
        
        echo json_encode($trabajadores);
    } catch (Exception $e) {
        echo json_encode(['error' => 'Error al obtener trabajadores: ' . $e->getMessage()]);
    }
}

function obtenerAverias() {
    global $pdo;
    
    try {
        $query = "SELECT codigo, nombre FROM averia ORDER BY nombre";
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $averias = $stmt->fetchAll();
        
        echo json_encode($averias);
    } catch (Exception $e) {
        echo json_encode(['error' => 'Error al obtener averías: ' . $e->getMessage()]);
    }
}

function obtenerRepuestos() {
    global $pdo;
    
    try {
        $query = "SELECT codigo, nombre, costo FROM pieza WHERE cantidad > 0 ORDER BY nombre";
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $repuestos = $stmt->fetchAll();
        
        echo json_encode($repuestos);
    } catch (Exception $e) {
        echo json_encode(['error' => 'Error al obtener repuestos: ' . $e->getMessage()]);
    }
}

function crearOrdenTrabajo() {
    global $pdo;
    
    try {
        // Iniciar transacción
        $pdo->beginTransaction();
        
        // 1. Crear orden de trabajo
        $queryOrden = "INSERT INTO orden_trabajo (vehiculo_id, descripcion, estado) 
                       VALUES (:vehiculo_id, :descripcion, 'Pendiente') 
                       RETURNING numero";
        
        $stmtOrden = $pdo->prepare($queryOrden);
        $stmtOrden->execute([
            ':vehiculo_id' => $_POST['vehiculo_patente'] ?? '',
            ':descripcion' => $_POST['descripcion'] ?? ''
        ]);
        
        $ordenId = $stmtOrden->fetchColumn();
        
        // 2. Asignar trabajador
        if (!empty($_POST['trabajador_rut'])) {
            $queryTrabajar = "INSERT INTO trabajar (persona_id, orden_trabajo_id) 
                              VALUES (:trabajador_id, :orden_id)";
            
            $stmtTrabajar = $pdo->prepare($queryTrabajar);
            $stmtTrabajar->execute([
                ':trabajador_id' => $_POST['trabajador_rut'],
                ':orden_id' => $ordenId
            ]);
        }
        
        // 3. Agregar averías (si las hay)
        if (isset($_POST['averias'])) {
            // Procesar averías
            $averias = [];
            foreach ($_POST as $key => $value) {
                if (strpos($key, 'averias') === 0 && preg_match('/averias\[(\d+)\]\[(\w+)\]/', $key, $matches)) {
                    $index = $matches[1];
                    $field = $matches[2];
                    if (!isset($averias[$index])) {
                        $averias[$index] = [];
                    }
                    $averias[$index][$field] = $value;
                }
            }
            
            foreach ($averias as $averia) {
                if (!empty($averia['id']) && !empty($averia['detalle'])) {
                    $queryAveria = "INSERT INTO orden_averia (orden_trabajo_numero, averia_id) 
                                    VALUES (:orden_id, :averia_id)";
                    
                    $stmtAveria = $pdo->prepare($queryAveria);
                    $stmtAveria->execute([
                        ':orden_id' => $ordenId,
                        ':averia_id' => $averia['id']
                    ]);
                }
            }
        }
        
        // 4. Agregar repuestos (si los hay)
        if (isset($_POST['repuestos'])) {
            // Procesar repuestos
            $repuestos = [];
            foreach ($_POST as $key => $value) {
                if (strpos($key, 'repuestos') === 0 && preg_match('/repuestos\[(\d+)\]\[(\w+)\]/', $key, $matches)) {
                    $index = $matches[1];
                    $field = $matches[2];
                    if (!isset($repuestos[$index])) {
                        $repuestos[$index] = [];
                    }
                    $repuestos[$index][$field] = $value;
                }
            }
            
            foreach ($repuestos as $repuesto) {
                if (!empty($repuesto['codigo']) && !empty($repuesto['cantidad'])) {
                    $costo = $repuesto['costo'] ?? 0;
                    
                    // Registrar en historial
                    $queryHistorial = "INSERT INTO historial_repuestos_vehiculo 
                                      (repuesto_codigo, vehiculo_patente, orden_trabajo_numero, 
                                       cantidad_instalada, costo_unitario) 
                                      VALUES (:repuesto_codigo, :vehiculo_patente, :orden_id, 
                                              :cantidad, :costo)";
                    
                    $stmtHistorial = $pdo->prepare($queryHistorial);
                    $stmtHistorial->execute([
                        ':repuesto_codigo' => $repuesto['codigo'],
                        ':vehiculo_patente' => $_POST['vehiculo_patente'],
                        ':orden_id' => $ordenId,
                        ':cantidad' => $repuesto['cantidad'],
                        ':costo' => $costo
                    ]);
                }
            }
        }
        
        $pdo->commit();
        echo json_encode(['success' => true, 'orden_id' => $ordenId, 'mensaje' => 'Orden creada exitosamente']);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function obtenerOrdenesActivas() {
    global $pdo;
    
    try {
        $pagina = max(1, intval($_GET['pagina'] ?? 1));
        $porPagina = intval($_GET['por_pagina'] ?? 10);
        $offset = ($pagina - 1) * $porPagina;
        
        // Construir condiciones y JOINS dinámicamente
        $condiciones = ["o.estado != 'Completada'"];
        $params = [];
        $joins = [
            "LEFT JOIN vehiculo v ON o.vehiculo_id = v.patente",
            "LEFT JOIN persona p ON v.persona_rut = p.rut",
            "LEFT JOIN trabajar t ON o.numero = t.orden_trabajo_id",
            "LEFT JOIN persona tr ON t.persona_id = tr.rut"
        ];
        
        if (!empty($_GET['estado'])) {
            $condiciones[] = "o.estado = :estado";
            $params[':estado'] = $_GET['estado'];
        }
        
        if (!empty($_GET['trabajador'])) {
            $condiciones[] = "t.persona_id = :trabajador";
            $params[':trabajador'] = $_GET['trabajador'];
        }
        
        $where = !empty($condiciones) ? 'WHERE ' . implode(' AND ', $condiciones) : '';
        $joinsStr = implode(' ', $joins);
        
        // Consulta para órdenes - CORREGIDA
        $query = "SELECT o.numero, o.fecha, o.descripcion, o.estado,
                         v.patente, v.color,
                         p.nombre || ' ' || p.apellido as cliente_nombre,
                         tr.nombre || ' ' || tr.apellido as trabajador_nombre
                  FROM orden_trabajo o
                  $joinsStr
                  $where
                  ORDER BY o.fecha DESC, o.numero DESC
                  LIMIT :limit OFFSET :offset";
        
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
        $ordenes = $stmt->fetchAll();
        
        // Contar total - también necesita los mismos JOINS
        $queryCount = "SELECT COUNT(*) 
                       FROM orden_trabajo o
                       $joinsStr
                       $where";
        
        $stmtCount = $pdo->prepare($queryCount);
        
        // Preparar parámetros para count
        $countParams = [];
        foreach ($params as $key => $value) {
            if ($key !== ':limit' && $key !== ':offset') {
                $countParams[$key] = $value;
            }
        }
        
        $stmtCount->execute($countParams);
        $total = $stmtCount->fetchColumn();
        $totalPaginas = ceil($total / $porPagina);
        
        echo json_encode([
            'ordenes' => $ordenes,
            'paginacion' => [
                'pagina' => $pagina,
                'por_pagina' => $porPagina,
                'total' => $total,
                'total_paginas' => $totalPaginas
            ]
        ]);
    } catch (Exception $e) {
        // Mensaje de error más detallado
        echo json_encode([
            'error' => 'Error al obtener órdenes: ' . $e->getMessage(),
            'query_debug' => $query ?? 'No hay query',
            'params_debug' => $params ?? 'No hay params'
        ]);
    }
}

function obtenerDetallesOrden() {
    global $pdo;
    
    try {
        $ordenId = $_GET['id'] ?? 0;
        
        if (!$ordenId) {
            echo json_encode(['error' => 'ID de orden no especificado']);
            return;
        }
        
        // Datos básicos
        $query = "SELECT o.*, v.*, 
                         p.nombre || ' ' || p.apellido as cliente_nombre,
                         tr.nombre || ' ' || tr.apellido as trabajador_nombre
                  FROM orden_trabajo o
                  LEFT JOIN vehiculo v ON o.vehiculo_id = v.patente
                  LEFT JOIN persona p ON v.persona_rut = p.rut
                  LEFT JOIN trabajar t ON o.numero = t.orden_trabajo_id
                  LEFT JOIN persona tr ON t.persona_id = tr.rut
                  WHERE o.numero = :id";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([':id' => $ordenId]);
        $orden = $stmt->fetch();
        
        if (!$orden) {
            echo json_encode(['error' => 'Orden no encontrada']);
            return;
        }
        
        // Averías
        $queryAverias = "SELECT a.nombre 
                         FROM orden_averia oa
                         LEFT JOIN averia a ON oa.averia_id = a.codigo
                         WHERE oa.orden_trabajo_numero = :id";
        $stmtAverias = $pdo->prepare($queryAverias);
        $stmtAverias->execute([':id' => $ordenId]);
        $averias = $stmtAverias->fetchAll();
        
        // Repuestos
        $queryRepuestos = "SELECT hr.repuesto_codigo, p.nombre, hr.cantidad_instalada, hr.costo_unitario
                           FROM historial_repuestos_vehiculo hr
                           LEFT JOIN pieza p ON hr.repuesto_codigo = p.codigo
                           WHERE hr.orden_trabajo_numero = :id";
        $stmtRepuestos = $pdo->prepare($queryRepuestos);
        $stmtRepuestos->execute([':id' => $ordenId]);
        $repuestos = $stmtRepuestos->fetchAll();
        
        echo json_encode([
            'orden' => $orden,
            'averias' => $averias,
            'repuestos' => $repuestos
        ]);
    } catch (Exception $e) {
        echo json_encode(['error' => 'Error al obtener detalles: ' . $e->getMessage()]);
    }
}

function cambiarEstadoOrden() {
    global $pdo;
    
    try {
        $ordenId = $_POST['orden_id'] ?? 0;
        $estado = $_POST['estado'] ?? '';
        
        if (!$ordenId || !$estado) {
            echo json_encode(['error' => 'Datos insuficientes']);
            return;
        }
        
        $query = "UPDATE orden_trabajo SET estado = :estado WHERE numero = :id";
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            ':estado' => $estado,
            ':id' => $ordenId
        ]);
        
        echo json_encode(['success' => true, 'mensaje' => 'Estado actualizado']);
    } catch (Exception $e) {
        echo json_encode(['error' => 'Error al cambiar estado: ' . $e->getMessage()]);
    }
}

function obtenerClienteInfo() {
    global $pdo;
    
    try {
        $rut = $_GET['rut'] ?? '';
        
        if (!$rut) {
            echo json_encode(['error' => 'RUT no especificado']);
            return;
        }
        
        $query = "SELECT p.*, 
                         (SELECT telefono FROM telefono_persona WHERE persona_id = p.rut LIMIT 1) as telefono,
                         d.region, d.ciudad, d.calle, d.numero
                  FROM persona p
                  LEFT JOIN direccion d ON p.direccion_codigo_postal = d.codigo_postal
                  WHERE p.rut = :rut";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([':rut' => $rut]);
        $cliente = $stmt->fetch();
        
        if (!$cliente) {
            echo json_encode(['error' => 'Cliente no encontrado']);
            return;
        }
        
        echo json_encode($cliente);
    } catch (Exception $e) {
        echo json_encode(['error' => 'Error al obtener información del cliente: ' . $e->getMessage()]);
    }
}

    function obtenerOrdenesPorCliente() {
        global $pdo;
        
        try {
            $clienteRut = $_GET['cliente_rut'] ?? '';
            
            if (!$clienteRut) {
                echo json_encode(['error' => 'RUT de cliente requerido']);
                return;
            }
            
            $query = "
                SELECT DISTINCT o.numero, o.fecha, o.descripcion, o.estado,
                            v.patente,
                            p.nombre || ' ' || p.apellido as cliente_nombre
                FROM orden_trabajo o
                JOIN vehiculo v ON o.vehiculo_id = v.patente
                JOIN persona p ON v.persona_rut = p.rut
                WHERE p.rut = :cliente_rut 
                AND o.estado NOT IN ('Completada', 'Cancelada')
                ORDER BY o.fecha DESC, o.numero DESC
            ";
            
            $stmt = $pdo->prepare($query);
            $stmt->execute([':cliente_rut' => $clienteRut]);
            $ordenes = $stmt->fetchAll();
            
            echo json_encode([
                'ordenes' => $ordenes,
                'total' => count($ordenes)
            ]);
            
        } catch (Exception $e) {
            echo json_encode(['error' => 'Error al obtener órdenes: ' . $e->getMessage()]);
        }
    }


function obtenerVehiculoInfo() {
    global $pdo;
    
    try {
        $patente = $_GET['patente'] ?? '';
        
        if (!$patente) {
            echo json_encode(['error' => 'Patente no especificada']);
            return;
        }
        
        $query = "SELECT v.*, 
                         p.nombre || ' ' || p.apellido as dueno_nombre,
                         m.nombre as marca, mo.nombre as modelo_nombre,
                         tv.nombre as tipo_vehiculo
                  FROM vehiculo v
                  LEFT JOIN persona p ON v.persona_rut = p.rut
                  LEFT JOIN tener t ON v.patente = t.vehiculo_id
                  LEFT JOIN modelo mo ON t.modelo_id = mo.codigo
                  LEFT JOIN marca m ON mo.marca_id = m.codigo
                  LEFT JOIN tipo_vehiculo tv ON t.tipo_vehiculo_id = tv.codigo
                  WHERE v.patente = :patente";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([':patente' => $patente]);
        $vehiculo = $stmt->fetch();
        
        if (!$vehiculo) {
            echo json_encode(['error' => 'Vehículo no encontrado']);
            return;
        }
        
        echo json_encode($vehiculo);
    } catch (Exception $e) {
        echo json_encode(['error' => 'Error al obtener información del vehículo: ' . $e->getMessage()]);
    }
}
?>