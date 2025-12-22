<?php
// test-api-directo.php
echo "<h2>Prueba directa de API de Órdenes</h2>";

// Verificar si el archivo de API existe
$apiFile = __DIR__ . '/api/ordenes-data.php';
if (!file_exists($apiFile)) {
    die("❌ El archivo de API no existe en: $apiFile");
}

echo "✅ Archivo de API encontrado<br>";

// Incluir el archivo de API directamente
$_SESSION = []; // Simular sesión vacía
$_GET['accion'] = 'obtener_clientes';

// Incluir el archivo API
ob_start();
include $apiFile;
$response = ob_get_clean();

echo "<h3>Respuesta de la API:</h3>";
echo "<pre>" . htmlspecialchars($response) . "</pre>";

// Probar si es JSON válido
$data = json_decode($response, true);
if (json_last_error() === JSON_ERROR_NONE) {
    echo "✅ Respuesta JSON válida<br>";
    if (isset($data['error'])) {
        echo "Error de la API: " . $data['error'] . "<br>";
    } else {
        echo "Datos recibidos: " . count($data) . " elementos<br>";
    }
} else {
    echo "❌ La respuesta NO es JSON válido<br>";
    echo "Error de JSON: " . json_last_error_msg() . "<br>";
}
?>