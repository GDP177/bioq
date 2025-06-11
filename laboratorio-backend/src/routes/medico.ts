// laboratorio-backend/src/routes/medico.ts
import express from 'express';
import { pool } from '../routes/db'; // asegúrate de que esté bien la ruta
import bcrypt from 'bcrypt';

const router = express.Router();

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM medicos WHERE email = ?', [email]
    );

    const medico = rows[0];

    if (!medico) {
      return res.status(401).json({ message: 'Correo no registrado' });
    }

    const isValidPassword = await bcrypt.compare(password, medico.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    return res.status(200).json({ message: 'Acceso válido', medico });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// DASHBOARD
router.get('/dashboard/:id', async (req, res) => {
  const medicoId = parseInt(req.params.id);

  try {
    // Nombre del médico
    const [medicoRows]: any = await pool.query(
      'SELECT nombre FROM medicos WHERE id = ?', [medicoId]
    );

    const medico = medicoRows[0];

    // Solicitudes pendientes
    const [solicitudesRows]: any = await pool.query(
      'SELECT COUNT(*) AS total FROM solicitudes WHERE medico_id = ? AND estado = "pendiente"',
      [medicoId]
    );

    // Resultados listos
    const [resultadosRows]: any = await pool.query(
      'SELECT COUNT(*) AS total FROM resultados WHERE medico_id = ? AND estado = "listo"',
      [medicoId]
    );

    // Pacientes recientes (últimas 3 solicitudes)
    const [pacientesRows]: any = await pool.query(
      `SELECT p.nombre, DATE_FORMAT(s.fecha, "%Y-%m-%d") AS fecha
       FROM solicitudes s
       JOIN pacientes p ON s.paciente_id = p.id
       WHERE s.medico_id = ?
       ORDER BY s.fecha DESC
       LIMIT 3`,
      [medicoId]
    );

    // Notificaciones recientes
    const [notificacionesRows]: any = await pool.query(
      `SELECT mensaje FROM notificaciones WHERE medico_id = ?
       ORDER BY fecha DESC LIMIT 5`,
      [medicoId]
    );

    return res.status(200).json({
      nombre_medico: medico?.nombre || "Médico",
      solicitudes_pendientes: solicitudesRows[0]?.total || 0,
      resultados_listos: resultadosRows[0]?.total || 0,
      pacientes_recientes: pacientesRows || [],
      notificaciones: notificacionesRows.map((n: any) => n.mensaje),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al cargar el dashboard' });
  }
});

export default router;
