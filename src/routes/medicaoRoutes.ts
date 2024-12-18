import express from 'express';
import { authenticateJWT } from '../middlewares/authenticateJWT';
import medicaoController from '../controllers/medicaoController';

const router = express.Router();

// Aplica o middleware de autenticação antes de acessar os métodos do controller
router.get('/estatisticas', authenticateJWT, medicaoController.obterEstatisticas);
router.get('/consumo-hora', authenticateJWT, medicaoController.obterConsumoPorHora);
router.get('/tensao-hora', authenticateJWT, medicaoController.obterTensaoPorHora);
router.get('/ptreativa-hora', authenticateJWT, medicaoController.obterPotenciaReativaPorHora);
router.get('/fatorpt-hora', authenticateJWT, medicaoController.obterFatorPotenciaPorHora);
router.get('/:macAddress', authenticateJWT, medicaoController.listarMedicoes);
router.get('/ambiente/:ambienteId', authenticateJWT, medicaoController.listarMedicoesPorAmbiente);

export default router;
