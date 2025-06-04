<?php
$dsn= 'mysql:dbname=mybqq;host=localhost';
$usuario= 'root';
$contraseña= '';

try{
    $gbd=new PDO($dsn,$usuario,$contraseña);
}catch(PDOException $e){
    echo 'Falló la conexión: '.$e->getMessage();
}
