<?php
// test-connection.php
session_start();
// Simular sesión de administrador para pruebas
$_SESSION['autenticado'] = TRUE;
$_SESSION['tipo_persona'] = 'Administrador';

require_once 'config/database.php';  // Asegúrate de que la ruta sea correcta

echo "<h2>Prueba de conexión a PostgreSQL</h2>";

try {
    // Usar tu función helper existente
    $pdo = getDB();
    echo "✅ Conexión exitosa usando getDB()<br><br>";
    
    // Probar una consulta simple
    $stmt = $pdo->query("SELECT current_database() as db, current_user as user, version() as version");
    $result = $stmt->fetch();
    
    echo "Base de datos: " . $result['db'] . "<br>";
    echo "Usuario: " . $result['user'] . "<br>";
    echo "Versión PostgreSQL: " . $result['version'] . "<br><br>";
    
    // Probar tablas específicas del dashboard
    echo "<h3>Verificación de tablas del dashboard:</h3>";
    
    $tablas = ['persona', 'vehiculo', 'factura', 'orden_trabajo', 'pieza', 'averia'];
    
    foreach ($tablas as $tabla) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM $tabla");
            $count = $stmt->fetch()['count'];
            echo "✅ $tabla: $count registros<br>";
        } catch (Exception $e) {
            echo "❌ $tabla: ERROR - " . $e->getMessage() . "<br>";
        }
    }
    
    echo "<br><h3>Prueba de consultas del dashboard:</h3>";
    
    // Probar consulta de ingresos mensuales
    echo "<h4>Ingresos mensuales:</h4>";
    $query = "SELECT EXTRACT(MONTH FROM f.fecha_emision) as mes, COALESCE(SUM(f.total), 0) as total FROM factura f WHERE EXTRACT(YEAR FROM f.fecha_emision) = 2024 GROUP BY EXTRACT(MONTH FROM f.fecha_emision) ORDER BY mes";
    try {
        $stmt = $pdo->query($query);
        $resultados = $stmt->fetchAll();
        if (count($resultados) > 0) {
            foreach ($resultados as $row) {
                echo "Mes {$row['mes']}: $" . number_format($row['total']) . "<br>";
            }
        } else {
            echo "No hay datos de facturación<br>";
        }
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "<br>";
    }
    
    echo "<h4>Clientes nuevos (últimos 7 días):</h4>";
    $query = "SELECT DATE(p.fecha_registro) as fecha, COUNT(*) as cantidad FROM persona p WHERE p.fecha_registro >= CURRENT_DATE - INTERVAL '7 days' AND p.tipo_persona = 'Cliente' GROUP BY DATE(p.fecha_registro) ORDER BY fecha";
    try {
        $stmt = $pdo->query($query);
        $resultados = $stmt->fetchAll();
        if (count($resultados) > 0) {
            foreach ($resultados as $row) {
                echo $row['fecha'] . ": " . $row['cantidad'] . " clientes<br>";
            }
        } else {
            echo "No hay clientes nuevos en los últimos 7 días<br>";
        }
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "<br>";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "<br>";
    echo "<br>Verifica:<br>";
    echo "1. Que PostgreSQL esté corriendo en localhost:5432<br>";
    echo "2. Que el usuario 'postgres' tenga la contraseña '1234'<br>";
    echo "3. Que exista la base de datos 'postgres'<br>";
    echo "4. Que se hayan ejecutado las tablas del script SQL<br>";
}
?>