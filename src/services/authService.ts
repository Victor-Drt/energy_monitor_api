import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { Usuario } from '../models/Usuario';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;
    const user = await Usuario.create({ email, senha });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar usuário.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;
    const user = await Usuario.findOne({ where: { email } });
    if (user && await bcrypt.compare(senha, user.senha)) {
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
      res.json({ token });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao realizar login.' });
  }
};
