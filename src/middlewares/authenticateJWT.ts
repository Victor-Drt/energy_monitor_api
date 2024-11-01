import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'seu_segredo_aqui'; // Certifique-se de definir sua chave secreta no arquivo .env

// Middleware para autenticação com JWT
export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  // Obtendo o token do cabeçalho de autorização
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Se o token não for fornecido, retorna um status 401 (não autorizado)
  if (!token) {
    res.sendStatus(401); // Unauthorized
    return; // Interrompe a execução
  }

  // Verifica o token usando a chave secreta
  jwt.verify(token, secret, (err, user) => {
    if (err) {
      res.sendStatus(403); // Forbidden
      return; // Interrompe a execução
    }

    // Se o token for válido, adiciona o usuário ao objeto req
    req.user = user; // Altere o tipo conforme necessário para o seu caso
    next(); // Chama o próximo middleware ou rota
  });
};
