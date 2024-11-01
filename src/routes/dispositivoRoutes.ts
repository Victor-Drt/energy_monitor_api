import express from 'express';
import { criarDispositivo, listarDispositivos } from '../controllers/dispositivoController';
import { authenticateJWT } from '../middlewares/authenticateJWT';

const router = express.Router();

router.post('/', authenticateJWT, criarDispositivo);

router.get('/:ambienteId', authenticateJWT, listarDispositivos);

export default router;
