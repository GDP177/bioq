import { Request, Response } from 'express';
import { pool } from '../routes/db';

export const getOrdenes = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query('SELECT * FROM orden');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({ message: 'Error al obtener las órdenes' });
  }
};
