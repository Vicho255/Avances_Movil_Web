<?php
// test-api.php
session_start();
// Simular sesión de administrador para pruebas
$_SESSION['autenticado'] = TRUE;
$_SESSION['tipo_persona'] = 'Administrador';

require_once 'config/database.php';

echo "<h2>Prueba de API de Órdenes</h2>";

try {
    $pdo = getDB();
    echo "✅ Conexión exitosa<br><br>";
    
    // Probar cada endpoint usando curl o file_get_contents con contexto
    $endpoints = [
        'obtener_clientes' => 'api/ordenes-data.php?accion=obtener_clientes',
        'obtener_vehiculos' => 'api/ordenes-data.php?accion=obtener_vehiculos',
        'obtener_trabajadores' => 'api/ordenes-data.php?accion=obtener_trabajadores',
        'obtener_averias' => 'api/ordenes-data.php?accion=obtener_averias',
        'obtener_repuestos' => 'api/ordenes-data.php?accion=obtener_repuestos'
    ];
    
    $baseUrl = 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . '/';
    
    foreach ($endpoints as $nombre => $endpoint) {
        echo "<h3>Probando: $nombre</h3>";
        $url = $baseUrl . $endpoint;
        
        // Usar curl si está disponible
        if (function_exists('curl_init')) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HEADER, false);
            $response = curl_exec($ch);
            curl_close($ch);
        } else {
            // Usar file_get_contents con contexto de stream
            $context = stream_context_create([
                'http' => [
                    'header' => "Cookie: " . session_name() . "=" . session_id() . "\r\n"
                ]
            ]);
            $response = @file_get_contents($url, false, $context);
        }
        
        if ($response === FALSE) {
            echo "❌ Error al acceder a $url<br>";
            echo "URL completa: $url<br>";
            echo "Asegúrate de que el archivo api/ordenes-data.php exista en: " . __DIR__ . "/api/ordenes-data.php<br>";
        } else {
            $data = json_decode($response, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                if (isset($data['error'])) {
                    echo "❌ Error: " . $data['error'] . "<br>";
                } else {
                    echo "✅ Respuesta JSON válida<br>";
                    echo "Elementos: " . (is_array($data) ? count($data) : 1) . "<br>";
                    echo "<pre>" . htmlspecialchars(substr($response, 0, 500)) . "...</pre>";
                }
            } else {
                echo "❌ Respuesta no es JSON válido:<br>";
                echo "<pre>" . htmlspecialchars(substr($response, 0, 500)) . "...</pre>";
            }
        }
        echo "<br>";
    }
    
    // Probar tablas directamente
    echo "<h3>Verificando tablas en la base de datos:</h3>";
    $tablas = ['persona', 'vehiculo', 'orden_trabajo', 'averia', 'pieza'];
    
    foreach ($tablas as $tabla) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM $tabla");
            $count = $stmt->fetch()['count'];
            echo "✅ $tabla: $count registros<br>";
        } catch (Exception $e) {
            echo "❌ $tabla: ERROR - " . $e->getMessage() . "<br>";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "<br>";
}

echo "<h3>Verificando estructura de directorios:</h3>";
echo "Directorio actual: " . __DIR__ . "<br>";
echo "Archivo database.php existe: " . (file_exists(__DIR__ . '/database.php') ? '✅ Sí' : '❌ No') . "<br>";
echo "Directorio api existe: " . (file_exists(__DIR__ . '/api') ? '✅ Sí' : '❌ No') . "<br>";
echo "Archivo api/ordenes-data.php existe: " . (file_exists(__DIR__ . '/api/ordenes-data.php') ? '✅ Sí' : '❌ No') . "<br>";
?>