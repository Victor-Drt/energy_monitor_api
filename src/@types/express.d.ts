import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
      }; // ou defina um tipo mais específico para o usuário
    }
  }
}
