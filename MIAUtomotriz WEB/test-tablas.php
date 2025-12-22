<?php
// test-tablas.php
require_once 'config/database.php';

echo "<h2>Verificación de tablas en la base de datos</h2>";

try {
    $pdo = getDB();
    echo "✅ Conexión exitosa a PostgreSQL<br><br>";
    
    // Lista de tablas necesarias para el sistema de órdenes
    $tablasNecesarias = [
        'persona',
        'vehiculo', 
        'orden_trabajo',
        'averia',
        'pieza',
        'marca',
        'modelo',
        'tipo_vehiculo',
        'tener',
        'trabajar',
        'orden_averia',
        'historial_repuestos_vehiculo'
    ];
    
    echo "<h3>Tablas necesarias:</h3>";
    foreach ($tablasNecesarias as $tabla) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM $tabla");
            $count = $stmt->fetch()['count'];
            echo "✅ $tabla: $count registros<br>";
        } catch (Exception $e) {
            echo "❌ $tabla: NO EXISTE o tiene error<br>";
            echo "   Error: " . $e->getMessage() . "<br>";
        }
    }
    
    // Probar consultas específicas
    echo "<br><h3>Prueba de consultas específicas:</h3>";
    
    // 1. Clientes
    echo "<h4>Clientes:</h4>";
    $query = "SELECT COUNT(*) as total FROM persona WHERE tipo_persona = 'Cliente'";
    $stmt = $pdo->query($query);
    $result = $stmt->fetch();
    echo "Total clientes: " . $result['total'] . "<br>";
    
    // 2. Vehículos
    echo "<h4>Vehículos:</h4>";
    $query = "SELECT COUNT(*) as total FROM vehiculo";
    $stmt = $pdo->query($query);
    $result = $stmt->fetch();
    echo "Total vehículos: " . $result['total'] . "<br>";
    
    // 3. Averías
    echo "<h4>Averías:</h4>";
    $query = "SELECT nombre FROM averia LIMIT 5";
    $stmt = $pdo->query($query);
    $averias = $stmt->fetchAll();
    echo "Primeras 5 averías: ";
    foreach ($averias as $averia) {
        echo $averia['nombre'] . ", ";
    }
    echo "<br>";
    
    // 4. Repuestos
    echo "<h4>Repuestos:</h4>";
    $query = "SELECT nombre, costo FROM pieza LIMIT 5";
    $stmt = $pdo->query($query);
    $repuestos = $stmt->fetchAll();
    echo "Primeros 5 repuestos: ";
    foreach ($repuestos as $repuesto) {
        echo $repuesto['nombre'] . " ($" . $repuesto['costo'] . "), ";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "<br>";
}
?>