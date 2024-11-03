import express from 'express';
import { authenticateJWT } from '../middlewares/authenticateJWT';
import medicaoController from '../controllers/medicaoController';

const router = express.Router();

// Aplica o middleware de autenticação antes de acessar os métodos do controller
router.get('/estatisticas', authenticateJWT, medicaoController.obterEstatisticas);
router.get('/:macAddress', authenticateJWT, medicaoController.listarMedicoes);
router.get('/ambiente/:ambienteId', authenticateJWT, medicaoController.listarMedicoesPorAmbiente);
// router.get('/dispositivo/:dispositivoId', authenticateJWT, medicaoController.listarMedicoesPorDispositivo);

export default router;
