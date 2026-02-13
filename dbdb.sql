-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 12-02-2026 a las 17:31:12
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `mybq`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `orden`
--

CREATE TABLE `orden` (
  `id_orden` int(11) NOT NULL,
  `nro_orden` varchar(50) NOT NULL,
  `urgente` tinyint(1) DEFAULT 0,
  `id_medico_solicitante` int(11) NOT NULL,
  `matricula_bq_efectua` varchar(50) DEFAULT NULL,
  `fecha_ingreso_orden` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_toma_muestra` timestamp NULL DEFAULT NULL,
  `fecha_procesamiento` timestamp NULL DEFAULT NULL,
  `fecha_finalizacion` timestamp NULL DEFAULT NULL,
  `nro_ficha_paciente` int(11) NOT NULL,
  `estado` enum('pendiente','en_proceso','finalizada','cancelada') DEFAULT 'pendiente',
  `observaciones` text DEFAULT NULL,
  `requiere_ayuno` tinyint(1) DEFAULT 0,
  `instrucciones_paciente` text DEFAULT NULL,
  `costo_total` decimal(10,2) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_modificacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `orden`
--

INSERT INTO `orden` (`id_orden`, `nro_orden`, `urgente`, `id_medico_solicitante`, `matricula_bq_efectua`, `fecha_ingreso_orden`, `fecha_toma_muestra`, `fecha_procesamiento`, `fecha_finalizacion`, `nro_ficha_paciente`, `estado`, `observaciones`, `requiere_ayuno`, `instrucciones_paciente`, `costo_total`, `fecha_creacion`, `fecha_modificacion`) VALUES
(1, 'ORD-2025-001', 0, 5, NULL, '2025-06-11 00:33:29', NULL, '2026-02-09 18:44:51', NULL, 4, 'en_proceso', 'Control de rutina anual', 1, NULL, 2500.00, '2025-06-11 00:33:29', '2026-02-09 18:44:51'),
(2, 'ORD-2025-002', 1, 5, 'BQ001', '2025-06-11 00:33:29', NULL, '2025-06-11 00:33:29', '2026-01-13 20:23:04', 5, '', 'Paciente con síntomas de diabetes', 1, NULL, 3200.00, '2025-06-11 00:33:29', '2026-01-13 20:23:04'),
(3, 'ORD-2025-003', 0, 5, 'BQ002', '2025-06-11 00:33:29', NULL, '2025-06-11 00:33:29', '2025-06-11 00:33:29', 6, '', 'Seguimiento post-tratamiento', 0, NULL, 1800.00, '2025-06-11 00:33:29', '2025-06-11 00:33:29'),
(4, 'ORD-2025-004', 0, 5, 'BQ001', '2025-06-10 00:33:29', NULL, '2025-06-10 00:33:29', '2026-01-14 15:34:33', 7, '', 'Control de colesterol', 1, NULL, 2100.00, '2025-06-11 00:33:29', '2026-01-14 15:34:33'),
(5, 'ORD-2025-005', 1, 5, NULL, '2025-06-10 00:33:29', NULL, '2026-01-12 20:31:28', '2026-01-12 21:24:58', 8, '', 'Examen pre-operatorio urgente', 1, NULL, 4500.00, '2025-06-11 00:33:29', '2026-01-12 21:24:58'),
(6, 'ORD-2025-006', 0, 5, 'BQ003', '2025-06-10 00:33:29', NULL, '2025-06-10 00:33:29', '2025-06-10 00:33:29', 9, '', 'Chequeo anual', 1, NULL, 2800.00, '2025-06-11 00:33:29', '2025-06-11 00:33:29'),
(7, 'ORD-2025-007', 0, 5, 'BQ002', '2025-06-09 00:33:29', NULL, '2025-06-09 00:33:29', '2025-06-09 00:33:29', 10, '', 'Control de tiroides', 0, NULL, 1900.00, '2025-06-11 00:33:29', '2025-06-11 00:33:29'),
(8, 'ORD-2025-008', 1, 5, 'BQ001', '2025-06-08 00:33:29', NULL, '2025-06-08 00:33:29', NULL, 11, 'en_proceso', 'Seguimiento de tratamiento', 1, NULL, 3100.00, '2025-06-11 00:33:29', '2025-06-11 00:33:29'),
(9, 'ORD-2025-009', 0, 5, NULL, '2025-06-08 00:33:29', NULL, '2026-02-05 13:38:38', NULL, 12, 'en_proceso', 'Control ginecológico', 0, NULL, 2200.00, '2025-06-11 00:33:29', '2026-02-05 13:38:38'),
(10, 'ORD-2025-010', 0, 5, 'BQ003', '2025-06-06 00:33:29', NULL, '2025-06-06 00:33:29', '2025-06-07 00:33:29', 13, '', 'Análisis post-accidente', 0, NULL, 2600.00, '2025-06-11 00:33:29', '2025-06-11 00:33:29'),
(11, 'ORD-2025-011', 0, 5, 'BQ002', '2025-06-04 00:33:29', NULL, '2025-06-04 00:33:29', '2025-06-05 00:33:29', 14, '', 'Control de medicación', 1, NULL, 2300.00, '2025-06-11 00:33:29', '2025-06-11 00:33:29'),
(12, 'ORD-2025-012', 1, 5, 'BQ001', '2025-06-03 00:33:29', NULL, '2025-06-03 00:33:29', NULL, 15, 'en_proceso', 'Urgencia cardiológica', 1, NULL, 4200.00, '2025-06-11 00:33:29', '2025-06-11 00:33:29'),
(13, 'ORD-2025-013', 0, 5, 'BQ003', '2025-06-01 00:33:29', NULL, '2025-06-01 00:33:29', '2025-06-02 00:33:29', 16, '', 'Seguimiento oncológico', 0, NULL, 3800.00, '2025-06-11 00:33:29', '2025-06-11 00:33:29'),
(14, 'ORD-2025-014', 0, 5, 'BQ002', '2025-05-30 00:33:29', NULL, '2025-05-30 00:33:29', '2025-05-31 00:33:29', 17, '', 'Control renal', 1, NULL, 2700.00, '2025-06-11 00:33:29', '2025-06-11 00:33:29'),
(15, 'ORD-2025-015', 0, 5, 'BQ001', '2025-05-28 00:33:29', NULL, '2025-05-28 00:33:29', '2025-05-29 00:33:29', 18, '', 'Análisis de rutina', 1, NULL, 2400.00, '2025-06-11 00:33:29', '2025-06-11 00:33:29'),
(16, 'ORD-1770298579958-16', 1, 5, NULL, '2026-02-05 13:36:19', NULL, '2026-02-05 13:37:15', NULL, 26, 'en_proceso', NULL, 1, NULL, 0.00, '2026-02-05 13:36:19', '2026-02-05 13:37:15'),
(17, 'ORD-1770670602902-83', 0, 5, NULL, '2026-02-09 20:56:42', NULL, NULL, NULL, 27, 'en_proceso', 'Orden generada por Sistema', 0, NULL, 0.00, '2026-02-09 20:56:42', '2026-02-09 21:21:30'),
(18, 'ORD-1770670624561-11', 0, 5, NULL, '2026-02-09 20:57:04', NULL, NULL, NULL, 24, 'en_proceso', 'Orden generada por Sistema', 0, NULL, 0.00, '2026-02-09 20:57:04', '2026-02-09 21:25:11'),
(19, 'ORD-2026-2545', 1, 5, NULL, '2026-02-10 22:57:56', NULL, '2026-02-11 16:24:20', NULL, 26, 'en_proceso', '', 0, NULL, NULL, '2026-02-10 22:57:56', '2026-02-11 16:24:20'),
(20, 'ORD-2026-2321', 0, 5, NULL, '2026-02-11 16:32:07', NULL, NULL, NULL, 26, 'pendiente', 'prueba prueba prueba', 1, NULL, NULL, '2026-02-11 16:32:07', '2026-02-11 16:32:07'),
(21, 'ORD-2026-8271', 1, 5, NULL, '2026-02-12 15:52:46', NULL, '2026-02-12 16:24:47', NULL, 26, 'en_proceso', 'pruebaaass', 1, NULL, NULL, '2026-02-12 15:52:46', '2026-02-12 16:24:47'),
(22, 'ORD-1770913227565-21', 0, 5, NULL, '2026-02-12 16:20:27', NULL, NULL, NULL, 26, 'pendiente', 'Orden generada por Sistema', 0, NULL, 0.00, '2026-02-12 16:20:27', '2026-02-12 16:20:27');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `orden`
--
ALTER TABLE `orden`
  ADD PRIMARY KEY (`id_orden`),
  ADD UNIQUE KEY `nro_orden_UNIQUE` (`nro_orden`),
  ADD KEY `id_medico_solicitante_idx` (`id_medico_solicitante`),
  ADD KEY `matricula_bq_efectua_idx` (`matricula_bq_efectua`),
  ADD KEY `nro_ficha_paciente_idx` (`nro_ficha_paciente`),
  ADD KEY `idx_fecha_ingreso` (`fecha_ingreso_orden`),
  ADD KEY `idx_estado` (`estado`),
  ADD KEY `idx_urgente` (`urgente`),
  ADD KEY `idx_paciente_fecha` (`nro_ficha_paciente`,`fecha_ingreso_orden`),
  ADD KEY `idx_medico_fecha` (`id_medico_solicitante`,`fecha_ingreso_orden`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `orden`
--
ALTER TABLE `orden`
  MODIFY `id_orden` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
