<?php
echo "<h2>Test de Conexión PostgreSQL</h2>";

// Intento 1: Con tu clase
echo "<h3>1. Usando tu clase Database:</h3>";
require_once 'config/database.php';

$database = new Database();
$conn = $database->getConnection();

if ($conn) {
    echo "✅ Conexión exitosa usando tu clase<br>";
    
    // Probar consulta simple
    try {
        $stmt = $conn->query("SELECT version()");
        $version = $stmt->fetchColumn();
        echo "Versión PostgreSQL: $version<br>";
    } catch (Exception $e) {
        echo "❌ Error en consulta: " . $e->getMessage() . "<br>";
    }
} else {
    echo "❌ Falló la conexión con tu clase<br>";
}

// Intento 2: Conexión directa
echo "<h3>2. Conexión directa PDO:</h3>";
try {
    $pdo = new PDO(
        "pgsql:host=localhost;port=5432;dbname=miautomotriz",
        "postgres",
        ""  // Deja vacío si no tienes contraseña
    );
    echo "✅ Conexión directa exitosa<br>";
} catch (PDOException $e) {
    echo "❌ Error conexión directa: " . $e->getMessage() . "<br>";
}

// Intento 3: Verificar si PostgreSQL está instalado
echo "<h3>3. Verificación del sistema:</h3>";
if (extension_loaded('pdo_pgsql')) {
    echo "✅ Extensión PDO_PGSQL está cargada<br>";
} else {
    echo "❌ Extensión PDO_PGSQL NO está cargada<br>";
}

echo "<h3>4. Alternativas de conexión:</h3>";
// Probar diferentes configuraciones
$configs = [
    ["localhost", "5432", "postgres", ""],
    ["127.0.0.1", "5432", "postgres", "postgres"],  // contraseña común
    ["localhost", "5432", "postgres", "password"],
];

foreach ($configs as $config) {
    list($host, $port, $user, $pass) = $config;
    
    try {
        $pdo_test = new PDO("pgsql:host=$host;port=$port", $user, $pass);
        echo "✅ Conectado a $host:$port como $user<br>";
        
        // Listar bases de datos
        $stmt = $pdo_test->query("SELECT datname FROM pg_database WHERE datistemplate = false");
        $dbs = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "Bases de datos disponibles: " . implode(", ", $dbs) . "<br>";
        
    } catch (Exception $e) {
        echo "❌ No conecta a $host:$port - " . $e->getMessage() . "<br>";
    }
}
?>