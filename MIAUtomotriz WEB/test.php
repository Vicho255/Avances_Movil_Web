<?php
$host = "localhost";
$dbname = "template1";
$user = "postgres";
$password = "1234";

try {
    $conexion = new PDO(
        "pgsql:host=$host;port=5432;dbname=$dbname",
        $user,
        $password
    );
    echo "Conexión exitosa a PostgreSQL";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>