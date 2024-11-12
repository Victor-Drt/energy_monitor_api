import { Sequelize } from 'sequelize-typescript';
import { Usuario } from '../models/Usuario';
import { Ambiente } from '../models/Ambiente';
import { Dispositivo } from '../models/Dispositivo';
import { Medicao } from '../models/Medicao';
import { QualidadeEnergia } from '../models/QualidadeEnergia';

import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

export const sequelize = new Sequelize({
  dialect: 'postgres',
  dialectModule: pg,
  host: process.env.POSTGRES_HOST,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  models: [Usuario, Ambiente, Dispositivo, Medicao, QualidadeEnergia],
  port: Number(process.env.DB_PORT),
  // timezone: '-04:00',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,  // Habilita o SSL
      rejectUnauthorized: false  // Isso é necessário em alguns ambientes de produção (ajustar conforme necessário)
    }
  },
});

(async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('Conexão com o banco de dados foi bem-sucedida!');
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
  }
})();
