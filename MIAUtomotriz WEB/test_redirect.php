<?php
// test_redirect.php
echo "<h2>Test de Redirección</h2>";

// Test 1: Redirección simple
echo "<h3>Test 1: Redirección header()</h3>";
echo '<a href="test_redirect_target.php">Probar redirección</a>';

// Test 2: Verificar headers
echo "<h3>Test 2: Verificar headers</h3>";
if (headers_sent($filename, $linenum)) {
    echo "Headers ya enviados en $filename línea $linenum<br>";
} else {
    echo "Headers disponibles para enviar<br>";
}

// Test 3: Verificar sesiones
echo "<h3>Test 3: Sesiones</h3>";
session_start();
echo "Session ID: " . session_id() . "<br>";
echo "Session status: " . session_status() . "<br>";
?>