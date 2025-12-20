<?php
// debug-api.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Debug de API guardar-cliente.php</h1>";

// Incluir la API y capturar salida
ob_start();
try {
    include 'api/guardar-cliente.php';
    $output = ob_get_clean();
    
    echo "<h3>Salida de la API:</h3>";
    echo "<pre style='background:#f0f0f0; padding:10px; border:1px solid #ccc;'>";
    echo htmlspecialchars($output);
    echo "</pre>";
    
    // Intentar parsear como JSON
    if (!empty($output)) {
        $json = json_decode($output, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            echo "<h3>JSON parseado correctamente:</h3>";
            echo "<pre>" . print_r($json, true) . "</pre>";
        } else {
            echo "<p style='color:red'>✗ No es JSON válido</p>";
            echo "<p>Error: " . json_last_error_msg() . "</p>";
        }
    }
    
} catch (Exception $e) {
    $error = ob_get_clean();
    echo "<p style='color:red'>✗ Excepción: " . htmlspecialchars($e->getMessage()) . "</p>";
    if (!empty($error)) {
        echo "<p>Salida:</p><pre>" . htmlspecialchars($error) . "</pre>";
    }
}

// También mostrar información del servidor
echo "<h3>Información del servidor:</h3>";
echo "<pre>";
echo "PHP Version: " . phpversion() . "\n";
echo "POST data: " . print_r($_POST, true) . "\n";
echo "Headers recibidos:\n";
foreach (getallheaders() as $name => $value) {
    echo "  $name: $value\n";
}
echo "</pre>";
?>