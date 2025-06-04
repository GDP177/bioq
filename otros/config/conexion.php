<?php
/**
 * Clase para la conexión a la base de datos usando PDO
 */
class conexionBD {
    
    /**
     * Realiza la conexión a la base de datos usando PDO
     * @return PDO Objeto de conexión PDO
     */
    public function conexionPDO() {
        try {
            // Datos de conexión
            $host = 'localhost';
            $db_name = 'sistema_laboratorio';
            $username = 'root';  // Cambia esto por tu usuario de BD
            $password = 'root';      // Cambia esto por tu contraseña de BD
            
            // Crear conexión con PDO
            $pdo = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8", $username, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            return $pdo;
        } catch (PDOException $e) {
            echo 'Error de conexión: ' . $e->getMessage();
            exit;
        }
    }
    
    /**
     * Método para establecer una conexión MySQLi (alternativa)
     * @return mysqli Objeto de conexión mysqli
     */
    public function conexionMySQLi() {
        // Datos de conexión
        $host = 'localhost';
        $db_name = 'sistema_laboratorio';
        $username = 'root';  // Cambia esto por tu usuario de BD
        $password = '';      // Cambia esto por tu contraseña de BD
        
        // Crear conexión con MySQLi
        $mysqli = new mysqli($host, $username, $password, $db_name);
        
        // Verificar la conexión
        if ($mysqli->connect_error) {
            die('Error de conexión: ' . $mysqli->connect_error);
        }
        
        // Establecer charset
        $mysqli->set_charset("utf8");
        
        return $mysqli;
    }
}
?>