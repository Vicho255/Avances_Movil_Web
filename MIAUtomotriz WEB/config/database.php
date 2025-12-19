<?php
class Database {
    private $host = "localhost";
    private $port = "5432";
    private $db_name = "postgres";  // ← Usamos postgres en lugar de miautomotriz
    private $username = "postgres";
    private $password = "1234";  // Vacío porque configuraste 'trust'
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $dsn = "pgsql:host=$this->host;port=$this->port;dbname=$this->db_name";
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            return $this->conn;
        } catch(PDOException $exception) {
            error_log("Error PostgreSQL: " . $exception->getMessage());
            return null;
        }
    }
}
?>