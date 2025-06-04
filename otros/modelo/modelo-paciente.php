<?php
require_once 'conexion.php';

class Modelo_Paciente extends conexionBD {
    
    /**
     * Lista los pacientes para el datatable
     * @return array Arreglo con datos de pacientes
     */
    public function listarPacientes() {
        $c = conexionBD::conexionPDO();
        $sql = "SELECT 
                nro_ficha,
                Nombre_paciente,
                Apellido_paciente,
                DNI,
                DATE_FORMAT(fecha_nacimiento, '%d/%m/%Y') as fecha_nacimiento,
                edad,
                sexo,
                mutual,
                nro_afiliado,
                grupo_sanguineo,
                estado,
                telefono,
                CP,
                direccion
                FROM paciente 
                ORDER BY Apellido_paciente, Nombre_paciente";
        $arreglo = array();
        $query = $c->prepare($sql);
        $query->execute();
        $resultado = $query->fetchAll(PDO::FETCH_ASSOC);
        
        foreach($resultado as $respuesta) {
            $arreglo["data"][] = $respuesta;
        }
        
        return $arreglo;
    }
    
    /**
     * Registra un nuevo paciente
     * @param string $nombre Nombre del paciente
     * @param string $apellido Apellido del paciente
     * @param string $fecha_nacimiento Fecha de nacimiento (formato Y-m-d)
     * @param string $sexo Sexo (M/F)
     * @param string $mutual Nombre de la mutual
     * @param int $nro_afiliado Número de afiliado
     * @param string $grupo_sanguineo Grupo sanguíneo
     * @param int $dni DNI del paciente
     * @param int $cp Código postal
     * @param string $direccion Dirección del paciente
     * @param int $telefono Teléfono del paciente
     * @return int ID del paciente creado o 0 si falló
     */
    public function registrarPaciente($nombre, $apellido, $fecha_nacimiento, $sexo, $mutual, $nro_afiliado, $grupo_sanguineo, $dni, $cp, $direccion, $telefono) {
        try {
            $c = conexionBD::conexionPDO();
            
            // Verificar si ya existe un paciente con el mismo DNI
            $sql_verificar = "SELECT COUNT(*) FROM paciente WHERE DNI = ?";
            $query_verificar = $c->prepare($sql_verificar);
            $query_verificar->bindParam(1, $dni);
            $query_verificar->execute();
            $existe = $query_verificar->fetchColumn();
            
            if ($existe > 0) {
                return -1; // Paciente con este DNI ya existe
            }
            
            // Calcular la edad a partir de la fecha de nacimiento
            $fecha_nacimiento_obj = new DateTime($fecha_nacimiento);
            $fecha_actual = new DateTime();
            $diferencia = $fecha_nacimiento_obj->diff($fecha_actual);
            $edad = $diferencia->y;
            
            // Fecha de alta es la fecha actual
            $fecha_alta = date('Y-m-d');
            
            // Estado por defecto "activo"
            $estado = "activo";
            
            // Obtener el siguiente número de ficha
            $sql_ficha = "SELECT MAX(nro_ficha) + 1 FROM paciente";
            $query_ficha = $c->prepare($sql_ficha);
            $query_ficha->execute();
            $nro_ficha = $query_ficha->fetchColumn();
            
            if (!$nro_ficha) {
                $nro_ficha = 1; // Si no hay pacientes, empezar desde 1
            }
            
            $sql = "INSERT INTO paciente (nro_ficha, Nombre_paciente, Apellido_paciente, fecha_alta, fecha_nacimiento, edad, 
                    sexo, estado, mutual, nro_afiliado, grupo_sanguineo, DNI, CP, direccion, telefono) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $query = $c->prepare($sql);
            $query->bindParam(1, $nro_ficha);
            $query->bindParam(2, $nombre);
            $query->bindParam(3, $apellido);
            $query->bindParam(4, $fecha_alta);
            $query->bindParam(5, $fecha_nacimiento);
            $query->bindParam(6, $edad);
            $query->bindParam(7, $sexo);
            $query->bindParam(8, $estado);
            $query->bindParam(9, $mutual);
            $query->bindParam(10, $nro_afiliado);
            $query->bindParam(11, $grupo_sanguineo);
            $query->bindParam(12, $dni);
            $query->bindParam(13, $cp);
            $query->bindParam(14, $direccion);
            $query->bindParam(15, $telefono);
            $resultado = $query->execute();
            
            if ($resultado) {
                return $nro_ficha;
            } else {
                return 0;
            }
        } catch (Exception $e) {
            return 0;
        }
    }
    
    /**
     * Actualiza los datos de un paciente existente
     * @param int $nro_ficha Número de ficha del paciente
     * @param string $nombre Nombre del paciente
     * @param string $apellido Apellido del paciente
     * @param string $fecha_nacimiento Fecha de nacimiento (formato Y-m-d)
     * @param string $sexo Sexo (M/F)
     * @param string $mutual Nombre de la mutual
     * @param int $nro_afiliado Número de afiliado
     * @param string $grupo_sanguineo Grupo sanguíneo
     * @param string $estado Estado del paciente (activo/inactivo)
     * @param int $cp Código postal
     * @param string $direccion Dirección del paciente
     * @param int $telefono Teléfono del paciente
     * @return int 1 si fue exitoso, 0 si falló
     */
    public function modificarPaciente($nro_ficha, $nombre, $apellido, $fecha_nacimiento, $sexo, $mutual, $nro_afiliado, $grupo_sanguineo, $estado, $cp, $direccion, $telefono) {
        try {
            $c = conexionBD::conexionPDO();
            
            // Calcular la edad a partir de la fecha de nacimiento
            $fecha_nacimiento_obj = new DateTime($fecha_nacimiento);
            $fecha_actual = new DateTime();
            $diferencia = $fecha_nacimiento_obj->diff($fecha_actual);
            $edad = $diferencia->y;
            
            $sql = "UPDATE paciente SET 
                    Nombre_paciente = ?, 
                    Apellido_paciente = ?, 
                    fecha_nacimiento = ?, 
                    edad = ?,
                    sexo = ?,
                    mutual = ?,
                    nro_afiliado = ?,
                    grupo_sanguineo = ?,
                    estado = ?,
                    CP = ?,
                    direccion = ?,
                    telefono = ?
                    WHERE nro_ficha = ?";
            $query = $c->prepare($sql);
            $query->bindParam(1, $nombre);
            $query->bindParam(2, $apellido);
            $query->bindParam(3, $fecha_nacimiento);
            $query->bindParam(4, $edad);
            $query->bindParam(5, $sexo);
            $query->bindParam(6, $mutual);
            $query->bindParam(7, $nro_afiliado);
            $query->bindParam(8, $grupo_sanguineo);
            $query->bindParam(9, $estado);
            $query->bindParam(10, $cp);
            $query->bindParam(11, $direccion);
            $query->bindParam(12, $telefono);
            $query->bindParam(13, $nro_ficha);
            $resultado = $query->execute();
            
            if ($resultado) {
                return 1;
            } else {
                return 0;
            }
        } catch (Exception $e) {
            return 0;
        }
    }
    
    /**
     * Busca pacientes por nombre, apellido o DNI
     * @param string $valor Texto de búsqueda
     * @return array Pacientes encontrados
     */
    public function buscarPacientes($valor) {
        $c = conexionBD::conexionPDO();
        $sql = "SELECT 
                    nro_ficha as paciente_id, 
                    CONCAT(Apellido_paciente, ' ', Nombre_paciente) as paciente,
                    DNI as paciente_dni 
                FROM paciente 
                WHERE estado = 'activo' 
                AND (Nombre_paciente LIKE :valor OR Apellido_paciente LIKE :valor OR DNI LIKE :valor)";
        $query = $c->prepare($sql);
        $query->bindValue(':valor', '%'.$valor.'%');
        $query->execute();
        $resultado = $query->fetchAll(PDO::FETCH_ASSOC);
        
        return $resultado;
    }
    
    /**
     * Obtiene los datos completos de un paciente por su nro_ficha
     * @param int $nro_ficha Número de ficha del paciente
     * @return array Datos del paciente
     */
    public function obtenerPaciente($nro_ficha) {
        $c = conexionBD::conexionPDO();
        $sql = "SELECT * FROM paciente WHERE nro_ficha = ?";
        $query = $c->prepare($sql);
        $query->bindParam(1, $nro_ficha);
        $query->execute();
        $resultado = $query->fetch(PDO::FETCH_ASSOC);
        
        return $resultado;
    }
}
?>