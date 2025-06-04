-- Script para cargar datos de muestra en la base de datos
-- Ejecutar después de schema.sql

-- Seleccionar la base de datos
USE sistema_laboratorio;

-- Insertar datos de muestra para análisis
INSERT INTO analisis (CODIGO_DE_MODULO, DESCRIPCION_DE_MODULO, CODIGO_DE_PRACTICA, DESCRIPCION_DE_PRACTICA, INICIO_DE_VIGENCIA, HONORARIOS, GASTOS, TIPO) VALUES
(1, 'HEMATOLOGÍA', 101, 'HEMOGRAMA COMPLETO', '2023-01-01', 50.00, 20.00, 'Clínico'),
(1, 'HEMATOLOGÍA', 102, 'RECUENTO DE PLAQUETAS', '2023-01-01', 35.00, 15.00, 'Clínico'),
(1, 'HEMATOLOGÍA', 103, 'TIEMPO DE PROTROMBINA', '2023-01-01', 40.00, 18.00, 'Clínico'),
(2, 'QUÍMICA CLÍNICA', 201, 'GLUCEMIA', '2023-01-01', 30.00, 12.00, 'Bioquímico'),
(2, 'QUÍMICA CLÍNICA', 202, 'COLESTEROL TOTAL', '2023-01-01', 35.00, 15.00, 'Bioquímico'),
(2, 'QUÍMICA CLÍNICA', 203, 'UREA', '2023-01-01', 30.00, 12.00, 'Bioquímico'),
(2, 'QUÍMICA CLÍNICA', 204, 'CREATININA', '2023-01-01', 30.00, 12.00, 'Bioquímico'),
(2, 'QUÍMICA CLÍNICA', 205, 'ÁCIDO ÚRICO', '2023-01-01', 35.00, 15.00, 'Bioquímico'),
(3, 'INMUNOLOGÍA', 301, 'FACTOR REUMATOIDEO', '2023-01-01', 60.00, 25.00, 'Bioquímico'),
(3, 'INMUNOLOGÍA', 302, 'PROTEÍNA C REACTIVA', '2023-01-01', 55.00, 23.00, 'Bioquímico'),
(4, 'MICROBIOLOGÍA', 401, 'UROCULTIVO', '2023-01-01', 80.00, 35.00, 'Bioquímico'),
(4, 'MICROBIOLOGÍA', 402, 'COPROCULTIVO', '2023-01-01', 85.00, 38.00, 'Bioquímico'),
(5, 'HORMONAS', 501, 'TSH', '2023-01-01', 90.00, 40.00, 'Bioquímico'),
(5, 'HORMONAS', 502, 'T4 LIBRE', '2023-01-01', 90.00, 40.00, 'Bioquímico'),
(6, 'PERFIL LIPÍDICO', 601, 'PERFIL LIPÍDICO COMPLETO', NULL, 120.00, 55.00, 'Bioquímico');

-- Insertar relaciones jerárquicas entre análisis
INSERT INTO incluye (cod_padre, cod_hijo, descripcion) VALUES
(601, 202, 'El perfil lipídico incluye colesterol total'),
(601, 205, 'El perfil lipídico incluye ácido úrico');

-- Insertar valores de referencia
INSERT INTO valor_referencia (valor_inicial_de_rango, valor_final_de_rango, unidad, tipo_persona) VALUES
(4.5, 5.5, 'mmol/L', 'Adulto'), -- Glucemia adulto
(4.0, 5.0, 'mmol/L', 'Niño'), -- Glucemia niño
(3.9, 5.2, 'mmol/L', 'Embarazada'), -- Glucemia embarazada
(3.5, 5.2, 'mmol/L', 'Adulto mayor'), -- Glucemia adulto mayor
(3.9, 6.1, 'mmol/L', 'Diabético'), -- Glucemia diabético
(4.0, 5.2, 'mg/dL', 'Adulto'), -- Colesterol total adulto
(3.5, 4.5, 'mg/dL', 'Niño'), -- Colesterol total niño
(2.5, 7.5, 'mg/dL', 'Adulto'), -- Urea adulto
(2.0, 6.0, 'mg/dL', 'Niño'), -- Urea niño
(0.7, 1.2, 'mg/dL', 'Adulto'), -- Creatinina adulto
(0.3, 0.7, 'mg/dL', 'Niño'), -- Creatinina niño
(3.4, 7.0, 'mg/dL', 'Hombre'), -- Ácido úrico hombre
(2.4, 6.0, 'mg/dL', 'Mujer'); -- Ácido úrico mujer

-- Insertar asociaciones entre análisis y valores de referencia
INSERT INTO tiene (CODIGO_DE_PRACTICA, id_valor_ref, valor_hallado, unidad_valor_hallado) VALUES
(201, 1, 0, 'mmol/L'), -- Glucemia - Adulto
(201, 2, 0, 'mmol/L'), -- Glucemia - Niño
(201, 3, 0, 'mmol/L'), -- Glucemia - Embarazada
(201, 4, 0, 'mmol/L'), -- Glucemia - Adulto mayor
(201, 5, 0, 'mmol/L'), -- Glucemia - Diabético
(202, 6, 0, 'mg/dL'), -- Colesterol total - Adulto
(202, 7, 0, 'mg/dL'), -- Colesterol total - Niño
(203, 8, 0, 'mg/dL'), -- Urea - Adulto
(203, 9, 0, 'mg/dL'), -- Urea - Niño
(204, 10, 0, 'mg/dL'), -- Creatinina - Adulto
(204, 11, 0, 'mg/dL'), -- Creatinina - Niño
(205, 12, 0, 'mg/dL'), -- Ácido úrico - Hombre
(205, 13, 0, 'mg/dL'); -- Ácido úrico - Mujer

-- Insertar médicos de muestra
INSERT INTO medico (Nombre_medico, Apellido_medico, DNI_medico) VALUES
('Juan', 'Pérez', '25987654'),
('María', 'González', '27456123'),
('Carlos', 'Rodríguez', '28123456'),
('Laura', 'Fernández', '30789456'),
('Roberto', 'Sánchez', '26543210');

-- Insertar bioquímicos de muestra
INSERT INTO bioquimico (Matricula_profesional, Nombre_bq, Apellido_bq) VALUES
(12345, 'Ana', 'Martínez'),
(23456, 'Miguel', 'López'),
(34567, 'Lucía', 'García');

-- Insertar pacientes de muestra
INSERT INTO paciente (Nombre_paciente, Apellido_paciente, fecha_alta, fecha_nacimiento, edad, sexo, mutual, nro_afiliado, grupo_sanguineo, DNI, CP, direccion, telefono) VALUES
('Pedro', 'Gómez', '2023-01-15', '1980-05-20', 43, 'M', 'OSDE', '12345678', 'O+', '28765432', '1900', 'Calle 123', '555-1234'),
('Sofía', 'Torres', '2023-02-10', '1975-10-15', 48, 'F', 'Swiss Medical', '23456789', 'A+', '25678901', '1900', 'Avenida 456', '555-2345'),
('Martín', 'Díaz', '2023-03-05', '1990-07-25', 33, 'M', 'OSPRERA', '34567890', 'B-', '35432109', '1900', 'Boulevard 789', '555-3456'),
('Valentina', 'Ruiz', '2023-03-20', '1985-12-30', 38, 'F', 'OSECAC', '45678901', 'AB+', '32109876', '1900', 'Plaza 1010', '555-4567'),
('Luciano', 'Castro', '2023-04-12', '1982-03-18', 41, 'M', 'IOMA', '56789012', 'O-', '29876543', '1900', 'Pasaje 222', '555-5678');

-- Insertar órdenes de muestra
INSERT INTO orden (urgente, id_medico_solicitante, id_bq_efectua, fecha_ingreso_orden, nro_ficha_paciente) VALUES
(0, 1, 12345, '2023-05-10', 1),
(1, 2, 23456, '2023-05-12', 2),
(0, 3, 34567, '2023-05-15', 3),
(0, 4, 12345, '2023-05-18', 4),
(1, 5, 23456, '2023-05-20', 5);

-- Insertar relaciones entre órdenes y análisis
INSERT INTO orden_has_analisis (Codigo_de_practica, id_orden, fecha_realizacion_analisis) VALUES
(101, 1, '2023-05-11'),
(201, 1, '2023-05-11'),
(202, 1, '2023-05-11'),
(101, 2, '2023-05-12'),
(201, 2, '2023-05-12'),
(301, 2, '2023-05-12'),
(101, 3, NULL),
(201, 3, NULL),
(301, 3, NULL),
(401, 3, NULL),
(101, 4, '2023-05-19'),
(201, 4, '2023-05-19'),
(501, 4, NULL),
(502, 4, NULL),
(101, 5, NULL),
(201, 5, NULL),
(601, 5, NULL);

-- Insertar usuarios adicionales
INSERT INTO usuario (usu_nombre, usu_email, usu_contrasena, usu_rol, usu_estatus) VALUES
('secretaria', 'secretaria@laboratorio.com', '$2y$10$vz1v0hx6kT6C9mQvTCudRuiBK/L/h4T6QSfXvC.L.F5SL/vn2yJHm', 'secretaria', 'activo'),
('bioquimico', 'bioquimico@laboratorio.com', '$2y$10$vz1v0hx6kT6C9mQvTCudRuiBK/L/h4T6QSfXvC.L.F5SL/vn2yJHm', 'bioquimico', 'activo');
