<?php
// database.php

class Database {
    private static $instance = null;
    private $host = "localhost";
    private $port = "5432";
    private $db_name = "postgres";
    private $username = "postgres";
    private $password = "1234";
    private $conn;

    // Constructor privado para singleton
    private function __construct() {
        try {
            $dsn = "pgsql:host=$this->host;port=$this->port;dbname=$this->db_name";
            $this->conn = new PDO($dsn, $this->username, $this->password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]);
        } catch(PDOException $exception) {
            error_log("Error PostgreSQL: " . $exception->getMessage());
            throw new Exception("Error de conexión a la base de datos");
        }
    }

    // Método estático para obtener la instancia (Singleton)
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    // Obtener la conexión PDO
    public function getConnection() {
        return $this->conn;
    }
}

// Función helper para obtener la conexión fácilmente
function getDB() {
    return Database::getInstance()->getConnection();
}

// Función de prueba
function testConnection() {
    try {
        $db = getDB();
        $stmt = $db->query("SELECT current_database() as db, current_user as user");
        $result = $stmt->fetch();
        return "Conectado a: " . $result['db'] . " como " . $result['user'];
    } catch (Exception $e) {
        return "Error: " . $e->getMessage();
    }
}
?>