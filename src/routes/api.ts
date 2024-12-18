import express from 'express';
import { register, login } from '../services/authService';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Adicionar outras rotas para CRUD de ambientes, dispositivos e medições

export default router;
