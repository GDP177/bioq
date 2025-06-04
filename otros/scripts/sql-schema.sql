-- Script para crear la estructura de la base de datos del sistema BQ
-- Ejecutar como root o usuario con privilegios de creación de bases de datos

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS sistema_laboratorio CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- Seleccionar la base de datos
USE sistema_laboratorio;

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS usuario (
  usu_id INT AUTO_INCREMENT PRIMARY KEY,
  usu_nombre VARCHAR(100) NOT NULL UNIQUE,
  usu_email VARCHAR(100) NOT NULL,
  usu_contrasena VARCHAR(255) NOT NULL,
  usu_rol ENUM('administrador', 'bioquimico', 'secretaria') NOT NULL,
  usu_estatus ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  usu_fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Crear tabla de análisis
CREATE TABLE IF NOT EXISTS analisis (
  CODIGO_DE_MODULO INT DEFAULT NULL,
  DESCRIPCION_DE_MODULO VARCHAR(45) DEFAULT NULL,
  CODIGO_DE_PRACTICA INT NOT NULL,
  DESCRIPCION_DE_PRACTICA VARCHAR(45) DEFAULT NULL,
  INICIO_DE_VIGENCIA VARCHAR(45) DEFAULT NULL,
  HONORARIOS DOUBLE DEFAULT NULL,
  GASTOS DOUBLE DEFAULT NULL,
  TIPO VARCHAR(45) DEFAULT NULL,
  PRIMARY KEY (CODIGO_DE_PRACTICA)
) ENGINE=InnoDB;

-- Crear tabla de bioquímicos
CREATE TABLE IF NOT EXISTS bioquimico (
  Matricula_profesional INT NOT NULL,
  Nombre_bq VARCHAR(45) DEFAULT NULL,
  Apellido_bq VARCHAR(45) DEFAULT NULL,
  PRIMARY KEY (Matricula_profesional)
) ENGINE=InnoDB;

-- Crear tabla de relaciones jerárquicas entre análisis
CREATE TABLE IF NOT EXISTS incluye (
  cod_padre INT DEFAULT NULL,
  cod_hijo INT DEFAULT NULL,
  descripcion TEXT DEFAULT NULL,
  FOREIGN KEY (cod_padre) REFERENCES analisis(CODIGO_DE_PRACTICA),
  FOREIGN KEY (cod_hijo) REFERENCES analisis(CODIGO_DE_PRACTICA)
) ENGINE=InnoDB;

-- Crear tabla de médicos
CREATE TABLE IF NOT EXISTS medico (
  idMedico INT NOT NULL AUTO_INCREMENT,
  Nombre_medico VARCHAR(45) DEFAULT NULL,
  Apellido_medico VARCHAR(45) DEFAULT NULL,
  DNI_medico VARCHAR(20) DEFAULT NULL,
  PRIMARY KEY (idMedico)
) ENGINE=InnoDB;

-- Crear tabla de pacientes
CREATE TABLE IF NOT EXISTS paciente (
  nro_ficha INT NOT NULL AUTO_INCREMENT,
  Nombre_paciente VARCHAR(45) NOT NULL,
  Apellido_paciente VARCHAR(45) NOT NULL,
  fecha_alta DATE DEFAULT NULL,
  fecha_nacimiento DATE NOT NULL,
  edad INT DEFAULT NULL,
  sexo CHAR(1) NOT NULL,
  estado VARCHAR(45) DEFAULT 'activo',
  mutual VARCHAR(45) NOT NULL,
  nro_afiliado VARCHAR(45) DEFAULT NULL,
  grupo_sanguineo VARCHAR(4) NOT NULL,
  DNI VARCHAR(20) NOT NULL UNIQUE,
  CP VARCHAR(10) DEFAULT NULL,
  direccion VARCHAR(100) DEFAULT NULL,
  telefono VARCHAR(20) DEFAULT NULL,
  PRIMARY KEY (nro_ficha)
) ENGINE=InnoDB;

-- Crear tabla de valores de referencia
CREATE TABLE IF NOT EXISTS valor_referencia (
  id_valor_ref INT NOT NULL AUTO_INCREMENT,
  valor_inicial_de_rango FLOAT DEFAULT NULL,
  valor_final_de_rango FLOAT DEFAULT NULL,
  unidad VARCHAR(10) DEFAULT NULL,
  tipo_persona VARCHAR(10) DEFAULT NULL,
  PRIMARY KEY (id_valor_ref)
) ENGINE=InnoDB;

-- Crear tabla de órdenes
CREATE TABLE IF NOT EXISTS orden (
  id_orden INT NOT NULL AUTO_INCREMENT,
  urgente TINYINT(1) DEFAULT 0,
  id_medico_solicitante INT DEFAULT NULL,
  id_bq_efectua INT DEFAULT NULL,
  fecha_ingreso_orden DATE DEFAULT NULL,
  nro_ficha_paciente INT DEFAULT NULL,
  PRIMARY KEY (id_orden),
  FOREIGN KEY (id_medico_solicitante) REFERENCES medico(idMedico),
  FOREIGN KEY (id_bq_efectua) REFERENCES bioquimico(Matricula_profesional),
  FOREIGN KEY (nro_ficha_paciente) REFERENCES paciente(nro_ficha)
) ENGINE=InnoDB;

-- Crear tabla de relación entre órdenes y análisis
CREATE TABLE IF NOT EXISTS orden_has_analisis (
  Codigo_de_practica INT NOT NULL,
  id_orden INT NOT NULL,
  fecha_realizacion_analisis DATE DEFAULT NULL,
  PRIMARY KEY (Codigo_de_practica, id_orden),
  FOREIGN KEY (Codigo_de_practica) REFERENCES analisis(CODIGO_DE_PRACTICA),
  FOREIGN KEY (id_orden) REFERENCES orden(id_orden)
) ENGINE=InnoDB;

-- Crear tabla de valores hallados
CREATE TABLE IF NOT EXISTS tiene (
  CODIGO_DE_PRACTICA INT NOT NULL,
  id_valor_ref INT NOT NULL,
  valor_hallado FLOAT NOT NULL,
  unidad_valor_hallado VARCHAR(10) DEFAULT NULL,
  PRIMARY KEY (CODIGO_DE_PRACTICA, id_valor_ref),
  FOREIGN KEY (CODIGO_DE_PRACTICA) REFERENCES analisis(CODIGO_DE_PRACTICA),
  FOREIGN KEY (id_valor_ref) REFERENCES valor_referencia(id_valor_ref)
) ENGINE=InnoDB;

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_paciente_dni ON paciente(DNI);
CREATE INDEX idx_orden_fecha ON orden(fecha_ingreso_orden);
CREATE INDEX idx_orden_urgente ON orden(urgente);
CREATE INDEX idx_medico_apellido ON medico(Apellido_medico);
CREATE INDEX idx_bioquimico_apellido ON bioquimico(Apellido_bq);
CREATE INDEX idx_analisis_descripcion ON analisis(DESCRIPCION_DE_PRACTICA);
CREATE INDEX idx_orden_analisis_fecha ON orden_has_analisis(fecha_realizacion_analisis);

-- Crear usuario administrador por defecto (usuario: admin, contraseña: admin123)
-- La contraseña está hasheada con password_hash de PHP
INSERT INTO usuario (usu_nombre, usu_email, usu_contrasena, usu_rol, usu_estatus)
VALUES ('admin', 'admin@laboratorio.com', '$2y$10$vz1v0hx6kT6C9mQvTCudRuiBK/L/h4T6QSfXvC.L.F5SL/vn2yJHm', 'administrador', 'activo');
