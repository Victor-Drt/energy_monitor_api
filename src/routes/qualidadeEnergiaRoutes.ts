import express from 'express';
import { authenticateJWT } from '../middlewares/authenticateJWT';
import qualidadeEnergiaController from '../controllers/qualidadeEnergiaController';

const router = express.Router();

// Aplica o middleware de autenticação antes de acessar os métodos do controller
router.get('/calcular', authenticateJWT, qualidadeEnergiaController.calcularQualidadeEnergia);
router.get('/', authenticateJWT, qualidadeEnergiaController.listarQualidadeEnergia);

export default router;
