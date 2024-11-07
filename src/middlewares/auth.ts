import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'seu_segredo_aqui';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    res.sendStatus(401); // Unauthorized
    return; // Retorna para evitar continuar a execução
  }

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      res.sendStatus(403); // Forbidden
      return; // Retorna para evitar continuar a execução
    }
    // Atribuindo o usuário ao request
    (req as any).user = user; // Verifique se a interface Request foi estendida
    next(); // Chama o próximo middleware
  });
};
