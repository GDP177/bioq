// laboratorio-backend/src/routes/medico.ts
import express from 'express';
import { pool } from './db'; // conexión a tu base de datos
import bcrypt from 'bcrypt';

const router = express.Router();

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

export default router;
