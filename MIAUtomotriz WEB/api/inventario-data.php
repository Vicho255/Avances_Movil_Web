<?php
// api/inventario-data.php - VERSIÓN SIN stock_minimo
session_start();

// Verificar autenticación
if (!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== TRUE) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit();
}

// Verificar que sea administrador
if ($_SESSION['tipo_persona'] !== 'Administrador') {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Se requieren permisos de administrador']);
    exit();
}

header('Content-Type: application/json');

require_once __DIR__ . '/../config/database.php';

try {
    $pdo = getDB();
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error de conexión: ' . $e->getMessage()]);
    exit();
}

// Determinar acción
$accion = $_GET['accion'] ?? $_POST['accion'] ?? '';

switch ($accion) {
    case 'obtener_inventario':
        obtenerInventario();
        break;
    case 'obtener_repuesto':
        obtenerRepuesto();
        break;
    case 'obtener_inventarios':
        obtenerInventarios();
        break;
    case 'obtener_historial':
        obtenerHistorial();
        break;
    case 'generar_reporte':
        generarReporte();
        break;
    case 'crear_repuesto':
        crearRepuesto();
        break;
    case 'actualizar_repuesto':
        actualizarRepuesto();
        break;
    case 'eliminar_repuesto':
        eliminarRepuesto();
        break;
    case 'ajustar_stock':
        ajustarStock();
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Acción no válida']);
}

function obtenerInventario() {
    global $pdo;
    
    try {
        // Consulta MODIFICADA: sin stock_minimo
        $query = "
            SELECT 
                p.codigo,
                p.nombre,
                p.categoria,
                p.descripcion,
                p.numero_pieza,
                p.cantidad,
                p.costo,
                p.inventario_id,
                i.espacio
                -- NOTA: stock_minimo no existe en tu tabla
            FROM pieza p
            LEFT JOIN inventario i ON p.inventario_id = i.codigo
            ORDER BY p.categoria, p.nombre
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $inventario = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Agregar stock_minimo por defecto (5) a cada registro
        foreach ($inventario as &$item) {
            $item['stock_minimo'] = 5; // Valor por defecto
        }
        
        echo json_encode([
            'success' => true,
            'data' => $inventario,
            'count' => count($inventario)
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error al obtener inventario: ' . $e->getMessage()]);
    }
}

function obtenerRepuesto() {
    global $pdo;
    
    $codigo = $_GET['codigo'] ?? '';
    
    if (!$codigo) {
        echo json_encode(['success' => false, 'message' => 'Código de repuesto requerido']);
        return;
    }
    
    try {
        $query = "
            SELECT p.*, i.espacio 
            FROM pieza p
            LEFT JOIN inventario i ON p.inventario_id = i.codigo
            WHERE p.codigo = :codigo
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([':codigo' => $codigo]);
        $repuesto = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($repuesto) {
            // Agregar stock_minimo por defecto
            $repuesto['stock_minimo'] = 5;
            echo json_encode(['success' => true, 'data' => $repuesto]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Repuesto no encontrado']);
        }
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error al obtener repuesto: ' . $e->getMessage()]);
    }
}

function obtenerInventarios() {
    global $pdo;
    
    try {
        $query = "SELECT codigo, espacio FROM inventario ORDER BY espacio";
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $inventarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'data' => $inventarios]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error al obtener inventarios: ' . $e->getMessage()]);
    }
}

function obtenerHistorial() {
    global $pdo;
    
    $codigo = $_GET['codigo'] ?? '';
    
    if (!$codigo) {
        echo json_encode(['success' => false, 'message' => 'Código de repuesto requerido']);
        return;
    }
    
    try {
        // Verificar si existe la tabla de historial
        $checkQuery = "
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'historial_inventario'
            )
        ";
        
        $checkStmt = $pdo->prepare($checkQuery);
        $checkStmt->execute();
        $tableExists = $checkStmt->fetchColumn();
        
        if (!$tableExists) {
            echo json_encode(['success' => true, 'data' => []]);
            return;
        }
        
        $query = "
            SELECT * FROM historial_inventario 
            WHERE repuesto_codigo = :codigo 
            ORDER BY fecha DESC 
            LIMIT 50
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([':codigo' => $codigo]);
        $historial = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'data' => $historial]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error al obtener historial: ' . $e->getMessage()]);
    }
}

function generarReporte() {
    global $pdo;
    
    try {
        // Obtener estadísticas generales - MODIFICADO para no usar stock_minimo
        $statsQuery = "
            SELECT 
                COUNT(*) as total_repuestos,
                COALESCE(SUM(cantidad * costo), 0) as valor_total,
                SUM(CASE WHEN cantidad < 5 AND cantidad > 0 THEN 1 ELSE 0 END) as stock_bajo,
                SUM(CASE WHEN cantidad = 0 THEN 1 ELSE 0 END) as sin_stock
            FROM pieza
        ";
        
        $statsStmt = $pdo->prepare($statsQuery);
        $statsStmt->execute();
        $estadisticas = $statsStmt->fetch(PDO::FETCH_ASSOC);
        
        // Repuestos con stock bajo (usando 5 como valor por defecto)
        $stockBajoQuery = "
            SELECT codigo, nombre, cantidad, costo
            FROM pieza 
            WHERE cantidad < 5 AND cantidad > 0 
            ORDER BY cantidad ASC 
            LIMIT 20
        ";
        
        $stockBajoStmt = $pdo->prepare($stockBajoQuery);
        $stockBajoStmt->execute();
        $stockBajoLista = $stockBajoStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Repuestos sin stock
        $sinStockQuery = "
            SELECT codigo, nombre, costo 
            FROM pieza 
            WHERE cantidad = 0 
            ORDER BY nombre 
            LIMIT 20
        ";
        
        $sinStockStmt = $pdo->prepare($sinStockQuery);
        $sinStockStmt->execute();
        $sinStockLista = $sinStockStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Repuestos más valiosos (por valor total)
        $valiososQuery = "
            SELECT codigo, nombre, cantidad, costo, (cantidad * costo) as valor_total
            FROM pieza 
            WHERE cantidad > 0 
            ORDER BY valor_total DESC 
            LIMIT 10
        ";
        
        $valiososStmt = $pdo->prepare($valiososQuery);
        $valiososStmt->execute();
        $masValiosos = $valiososStmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'total_repuestos' => (int)($estadisticas['total_repuestos'] ?? 0),
                'valor_total' => (int)($estadisticas['valor_total'] ?? 0),
                'stock_bajo' => (int)($estadisticas['stock_bajo'] ?? 0),
                'sin_stock' => (int)($estadisticas['sin_stock'] ?? 0),
                'stock_bajo_lista' => $stockBajoLista,
                'sin_stock_lista' => $sinStockLista,
                'mas_valiosos' => $masValiosos
            ]
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error al generar reporte: ' . $e->getMessage()]);
    }
}

function crearRepuesto() {
    global $pdo;
    
    $codigo = $_POST['codigo'] ?? '';
    $nombre = $_POST['nombre'] ?? '';
    $categoria = $_POST['categoria'] ?? '';
    $cantidad = intval($_POST['cantidad'] ?? 0);
    $costo = intval($_POST['costo'] ?? 0);
    $inventario_id = !empty($_POST['inventario_id']) ? intval($_POST['inventario_id']) : null;
    
    if (!$codigo || !$nombre || !$categoria) {
        echo json_encode(['success' => false, 'message' => 'Código, nombre y categoría son requeridos']);
        return;
    }
    
    if ($cantidad < 0) {
        echo json_encode(['success' => false, 'message' => 'La cantidad no puede ser negativa']);
        return;
    }
    
    if ($costo < 0) {
        echo json_encode(['success' => false, 'message' => 'El costo no puede ser negativo']);
        return;
    }
    
    try {
        $pdo->beginTransaction();
        
        // Verificar si ya existe
        $checkQuery = "SELECT COUNT(*) FROM pieza WHERE codigo = :codigo";
        $checkStmt = $pdo->prepare($checkQuery);
        $checkStmt->execute([':codigo' => $codigo]);
        
        if ($checkStmt->fetchColumn() > 0) {
            throw new Exception('Ya existe un repuesto con este código');
        }
        
        // Verificar inventario si se proporciona
        if ($inventario_id) {
            $checkInventarioQuery = "SELECT COUNT(*) FROM inventario WHERE codigo = :inventario_id";
            $checkInventarioStmt = $pdo->prepare($checkInventarioQuery);
            $checkInventarioStmt->execute([':inventario_id' => $inventario_id]);
            
            if ($checkInventarioStmt->fetchColumn() == 0) {
                $inventario_id = null; // Si no existe, asignar null
            }
        }
        
        // Insertar repuesto - SIN stock_minimo
        $query = "
            INSERT INTO pieza (
                codigo, nombre, categoria, descripcion, numero_pieza,
                cantidad, costo, inventario_id
            ) VALUES (
                :codigo, :nombre, :categoria, :descripcion, :numero_pieza,
                :cantidad, :costo, :inventario_id
            )
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            ':codigo' => $codigo,
            ':nombre' => $nombre,
            ':categoria' => $categoria,
            ':descripcion' => $_POST['descripcion'] ?? null,
            ':numero_pieza' => $_POST['numero_pieza'] ?? null,
            ':cantidad' => $cantidad,
            ':costo' => $costo,
            ':inventario_id' => $inventario_id
        ]);
        
        // Registrar en historial si la cantidad es mayor a 0
        if ($cantidad > 0) {
            registrarEnHistorial($codigo, 'entrada', $cantidad, 0, $cantidad, 'Creación inicial del repuesto');
        }
        
        $pdo->commit();
        
        echo json_encode(['success' => true, 'message' => 'Repuesto creado exitosamente']);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'Error al crear repuesto: ' . $e->getMessage()]);
    }
}

function actualizarRepuesto() {
    global $pdo;
    
    $codigo = $_POST['codigo'] ?? '';
    $nombre = $_POST['nombre'] ?? '';
    $categoria = $_POST['categoria'] ?? '';
    $cantidad = intval($_POST['cantidad'] ?? 0);
    $costo = intval($_POST['costo'] ?? 0);
    $inventario_id = !empty($_POST['inventario_id']) ? intval($_POST['inventario_id']) : null;
    
    if (!$codigo || !$nombre || !$categoria) {
        echo json_encode(['success' => false, 'message' => 'Código, nombre y categoría son requeridos']);
        return;
    }
    
    if ($cantidad < 0) {
        echo json_encode(['success' => false, 'message' => 'La cantidad no puede ser negativa']);
        return;
    }
    
    if ($costo < 0) {
        echo json_encode(['success' => false, 'message' => 'El costo no puede ser negativo']);
        return;
    }
    
    try {
        $pdo->beginTransaction();
        
        // Obtener cantidad anterior
        $oldQuery = "SELECT cantidad FROM pieza WHERE codigo = :codigo FOR UPDATE";
        $oldStmt = $pdo->prepare($oldQuery);
        $oldStmt->execute([':codigo' => $codigo]);
        $cantidadAnterior = $oldStmt->fetchColumn();
        
        if ($cantidadAnterior === false) {
            throw new Exception('Repuesto no encontrado');
        }
        
        // Verificar inventario si se proporciona
        if ($inventario_id) {
            $checkInventarioQuery = "SELECT COUNT(*) FROM inventario WHERE codigo = :inventario_id";
            $checkInventarioStmt = $pdo->prepare($checkInventarioQuery);
            $checkInventarioStmt->execute([':inventario_id' => $inventario_id]);
            
            if ($checkInventarioStmt->fetchColumn() == 0) {
                $inventario_id = null; // Si no existe, asignar null
            }
        }
        
        // Actualizar repuesto - SIN stock_minimo
        $query = "
            UPDATE pieza SET
                nombre = :nombre,
                categoria = :categoria,
                descripcion = :descripcion,
                numero_pieza = :numero_pieza,
                cantidad = :cantidad,
                costo = :costo,
                inventario_id = :inventario_id
            WHERE codigo = :codigo
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            ':codigo' => $codigo,
            ':nombre' => $nombre,
            ':categoria' => $categoria,
            ':descripcion' => $_POST['descripcion'] ?? null,
            ':numero_pieza' => $_POST['numero_pieza'] ?? null,
            ':cantidad' => $cantidad,
            ':costo' => $costo,
            ':inventario_id' => $inventario_id
        ]);
        
        // Registrar ajuste si la cantidad cambió
        if ($cantidad != $cantidadAnterior) {
            $tipo = $cantidad > $cantidadAnterior ? 'entrada' : 'salida';
            $diferencia = abs($cantidad - $cantidadAnterior);
            registrarEnHistorial($codigo, $tipo, $diferencia, $cantidadAnterior, $cantidad, 'Actualización manual del repuesto');
        }
        
        $pdo->commit();
        
        echo json_encode(['success' => true, 'message' => 'Repuesto actualizado exitosamente']);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'Error al actualizar repuesto: ' . $e->getMessage()]);
    }
}

function eliminarRepuesto() {
    global $pdo;
    
    $codigo = $_POST['codigo'] ?? '';
    
    if (!$codigo) {
        echo json_encode(['success' => false, 'message' => 'Código de repuesto requerido']);
        return;
    }
    
    try {
        $pdo->beginTransaction();
        
        // Verificar si el repuesto existe
        $checkQuery = "SELECT COUNT(*) FROM pieza WHERE codigo = :codigo";
        $checkStmt = $pdo->prepare($checkQuery);
        $checkStmt->execute([':codigo' => $codigo]);
        
        if ($checkStmt->fetchColumn() == 0) {
            throw new Exception('Repuesto no encontrado');
        }
        
        // Eliminar repuesto
        $query = "DELETE FROM pieza WHERE codigo = :codigo";
        $stmt = $pdo->prepare($query);
        $stmt->execute([':codigo' => $codigo]);
        
        $pdo->commit();
        
        echo json_encode(['success' => true, 'message' => 'Repuesto eliminado exitosamente']);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'Error al eliminar repuesto: ' . $e->getMessage()]);
    }
}

function ajustarStock() {
    global $pdo;
    
    $codigo = $_POST['codigo'] ?? '';
    $cantidad = intval($_POST['cantidad'] ?? 0); // Nueva cantidad total
    $tipo = $_POST['tipo'] ?? 'ajuste';
    $motivo = $_POST['motivo'] ?? '';
    $costo = isset($_POST['costo']) && $_POST['costo'] !== '' ? intval($_POST['costo']) : null;
    
    if (!$codigo || !$motivo) {
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
        return;
    }
    
    if ($cantidad < 0) {
        echo json_encode(['success' => false, 'message' => 'La cantidad no puede ser negativa']);
        return;
    }
    
    try {
        $pdo->beginTransaction();
        
        // Obtener repuesto actual con bloqueo
        $currentQuery = "SELECT cantidad, costo FROM pieza WHERE codigo = :codigo FOR UPDATE";
        $currentStmt = $pdo->prepare($currentQuery);
        $currentStmt->execute([':codigo' => $codigo]);
        $repuesto = $currentStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$repuesto) {
            throw new Exception('Repuesto no encontrado');
        }
        
        $cantidadActual = $repuesto['cantidad'];
        $cantidadAnterior = $cantidadActual;
        
        // Calcular nueva cantidad y cantidad del movimiento
        $cantidadMovimiento = intval($_POST['cantidad_movimiento'] ?? 0);
        
        if ($tipo === 'entrada') {
            // $cantidad es la cantidad a agregar
            $nuevaCantidad = $cantidadActual + $cantidad;
            $cantidadMovimiento = $cantidad;
        } elseif ($tipo === 'salida') {
            // $cantidad es la cantidad a retirar
            if ($cantidad > $cantidadActual) {
                throw new Exception('No hay suficiente stock para esta salida');
            }
            $nuevaCantidad = $cantidadActual - $cantidad;
            $cantidadMovimiento = $cantidad;
        } else {
            // $cantidad es el nuevo stock total
            $nuevaCantidad = $cantidad;
            $cantidadMovimiento = abs($cantidad - $cantidadActual);
        }
        
        if ($nuevaCantidad < 0) {
            throw new Exception('El stock no puede ser negativo');
        }
        
        // Actualizar stock
        $updateQuery = "UPDATE pieza SET cantidad = :cantidad WHERE codigo = :codigo";
        $updateStmt = $pdo->prepare($updateQuery);
        $updateStmt->execute([
            ':cantidad' => $nuevaCantidad,
            ':codigo' => $codigo
        ]);
        
        // Actualizar costo si se proporciona
        if ($costo !== null && $costo >= 0) {
            $costoQuery = "UPDATE pieza SET costo = :costo WHERE codigo = :codigo";
            $costoStmt = $pdo->prepare($costoQuery);
            $costoStmt->execute([
                ':costo' => $costo,
                ':codigo' => $codigo
            ]);
        }
        
        // Registrar en historial
        registrarEnHistorial($codigo, $tipo, $cantidadMovimiento, $cantidadAnterior, $nuevaCantidad, $motivo);
        
        $pdo->commit();
        
        echo json_encode(['success' => true, 'message' => 'Stock ajustado exitosamente']);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'Error al ajustar stock: ' . $e->getMessage()]);
    }
}

function registrarEnHistorial($codigo, $tipo, $cantidad, $stock_anterior, $stock_nuevo, $motivo) {
    global $pdo;
    
    try {
        // Asegurar que existe la tabla
        $checkQuery = "
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'historial_inventario'
            )
        ";
        
        $checkStmt = $pdo->prepare($checkQuery);
        $checkStmt->execute();
        $tableExists = $checkStmt->fetchColumn();
        
        if (!$tableExists) {
            $createQuery = "
                CREATE TABLE historial_inventario (
                    id SERIAL PRIMARY KEY,
                    repuesto_codigo VARCHAR(40) NOT NULL,
                    tipo VARCHAR(20) NOT NULL,
                    cantidad INT NOT NULL,
                    stock_anterior INT NOT NULL,
                    stock_nuevo INT NOT NULL,
                    motivo TEXT,
                    usuario VARCHAR(100),
                    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (repuesto_codigo) REFERENCES pieza(codigo) ON DELETE CASCADE
                )
            ";
            try {
                $pdo->exec($createQuery);
            } catch (Exception $e) {
                error_log("Error creando tabla historial: " . $e->getMessage());
                return;
            }
        }
        
        $query = "
            INSERT INTO historial_inventario 
            (repuesto_codigo, tipo, cantidad, stock_anterior, stock_nuevo, motivo, usuario)
            VALUES (:codigo, :tipo, :cantidad, :stock_anterior, :stock_nuevo, :motivo, :usuario)
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            ':codigo' => $codigo,
            ':tipo' => $tipo,
            ':cantidad' => $cantidad,
            ':stock_anterior' => $stock_anterior,
            ':stock_nuevo' => $stock_nuevo,
            ':motivo' => $motivo,
            ':usuario' => $_SESSION['usuario'] ?? 'Sistema'
        ]);
        
    } catch (Exception $e) {
        // Log error pero no detener la transacción principal
        error_log("Error registrando en historial: " . $e->getMessage());
    }
}
?>