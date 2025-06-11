import { Router } from 'express';
import { getOrdenes } from '../controllers/orden.controller';

const router = Router();

router.get('/', getOrdenes);

export default router;
