<?php
// api/mano-obra.php - VERSIÓN COMPLETA
session_start();

// Verificar autenticación
if (!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] !== TRUE) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit();
}

require_once __DIR__ . '/../config/database.php';

try {
    $pdo = getDB();
    
    // Determinar qué datos devolver
    $ordenId = $_GET['orden_id'] ?? 0;
    $action = $_GET['action'] ?? 'listar'; // 'listar' o 'orden'
    
    if ($action === 'orden' && $ordenId) {
        // Obtener mano de obra específica de una orden
        $query = "
            SELECT mo.codigo, mo.descripcion, mo.costo
            FROM trabajar_2 t2
            JOIN mano_de_obra mo ON t2.mano_de_obra_id = mo.codigo
            WHERE t2.orden_trabajo_id = :orden_id
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([':orden_id' => $ordenId]);
        $manoObra = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Si no hay mano de obra registrada, devolver valores por defecto
        if (empty($manoObra)) {
            $manoObra = [
                ['codigo' => 0, 'descripcion' => 'Mano de obra general', 'costo' => 50000]
            ];
        }
    } else {
        // Listar toda la mano de obra disponible
        $query = "SELECT codigo, descripcion, costo FROM mano_de_obra ORDER BY descripcion";
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $manoObra = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Si no hay registros, crear algunos por defecto
        if (empty($manoObra)) {
            $manoObra = [
                ['codigo' => 1, 'descripcion' => 'Diagnóstico general', 'costo' => 25000],
                ['codigo' => 2, 'descripcion' => 'Cambio de aceite y filtro', 'costo' => 35000],
                ['codigo' => 3, 'descripcion' => 'Alineación y balanceo', 'costo' => 40000],
                ['codigo' => 4, 'descripcion' => 'Revisión de frenos', 'costo' => 30000],
                ['codigo' => 5, 'descripcion' => 'Cambio de batería', 'costo' => 20000],
                ['codigo' => 6, 'descripcion' => 'Lavado y detailing', 'costo' => 25000],
                ['codigo' => 7, 'descripcion' => 'Mantenimiento preventivo', 'costo' => 45000],
                ['codigo' => 8, 'descripcion' => 'Reparación de motor', 'costo' => 80000],
                ['codigo' => 9, 'descripcion' => 'Servicio de transmisión', 'costo' => 60000],
                ['codigo' => 10, 'descripcion' => 'Reparación eléctrica', 'costo' => 35000]
            ];
            
            // Opcional: Insertar en la base de datos
            try {
                $insertQuery = "INSERT INTO mano_de_obra (descripcion, costo) VALUES (:descripcion, :costo)";
                $insertStmt = $pdo->prepare($insertQuery);
                
                foreach ($manoObra as $item) {
                    $insertStmt->execute([
                        ':descripcion' => $item['descripcion'],
                        ':costo' => $item['costo']
                    ]);
                }
                
                // Recargar con IDs reales
                $stmt->execute();
                $manoObra = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
            } catch (Exception $e) {
                // Si hay error al insertar, mantener los datos por defecto
                error_log("Error insertando mano de obra por defecto: " . $e->getMessage());
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $manoObra,
        'count' => count($manoObra),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    error_log("Error en mano-obra.php: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => 'Error al cargar mano de obra: ' . $e->getMessage(),
        'data' => [
            ['codigo' => 1, 'descripcion' => 'Diagnóstico general', 'costo' => 25000],
            ['codigo' => 2, 'descripcion' => 'Cambio de aceite y filtro', 'costo' => 35000],
            ['codigo' => 3, 'descripcion' => 'Alineación y balanceo', 'costo' => 40000]
        ]
    ]);
}
?>