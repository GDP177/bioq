import express, { Request, Response } from 'express';
import { pool } from './db'; // Ajusta la ruta si tu archivo db está en otro lugar

const router = express.Router();

// GET: Lista de análisis pendientes para el bioquímico
router.get('/pendientes', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        o.id_orden,
        p.nombre AS paciente,
        o.fecha,
        e.nombre_examen,
        r.resultado,
        r.estado
      FROM orden o
      JOIN paciente p ON o.id_paciente = p.id_paciente
      JOIN resultado r ON r.id_orden = o.id_orden
      JOIN examen e ON r.id_examen = e.id_examen
      WHERE r.estado = 'pendiente'
      ORDER BY o.fecha DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener análisis pendientes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT: Actualizar resultado de un examen (por el bioquímico)
router.put('/resultado/:id', async (req: Request, res: Response) => {
  const resultadoId = req.params.id;
  const { resultado, estado } = req.body;

  try {
    const [updateResult] = await pool.query(
      'UPDATE resultado SET resultado = ?, estado = ? WHERE id_orden = ?',
      [resultado, estado || 'completado', resultadoId]
    );

    res.json({ message: 'Resultado actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar resultado:', error);
    res.status(500).json({ message: 'Error interno al actualizar resultado' });
  }
});

export default router;
