import dotenv from 'dotenv';

dotenv.config();

export const jwtConfig = {
    secret: process.env.JWT_SECRET || 'sua_chave_secreta',
    expiresIn: '1h',
  };
  