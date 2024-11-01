import express from 'express';
import { atualizarAmbiente, criarAmbiente, deletarAmbiente, listarAmbientes } from '../controllers/ambienteController';
import { authenticateJWT } from '../middlewares/authenticateJWT'; // Importar corretamente

const router = express.Router();

router.post('/', authenticateJWT, criarAmbiente);
router.get('/', authenticateJWT, listarAmbientes);
router.put('/:id', authenticateJWT, atualizarAmbiente);         // Atualizar ambiente
router.delete('/:id', authenticateJWT, deletarAmbiente);        // Deletar ambiente

export default router;
