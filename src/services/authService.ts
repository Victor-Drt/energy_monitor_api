import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs'; // Alterado de bcrypt para bcryptjs
import { Request, Response } from 'express';
import { Usuario } from '../models/Usuario';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    // Hash da senha antes de salvar o usuário
    // const hashedPassword = await bcrypt.hash(senha, 10); // Aqui usamos o bcryptjs para fazer o hash
    const user = await Usuario.create({ email, senha }); // Salvar a senha hash no banco de dados
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar usuário.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;
    const user = await Usuario.findOne({ where: { email } });

    if (user && await user.checkPassword(senha)) {
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
      res.json({ token });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao realizar login.' });
  }
};
