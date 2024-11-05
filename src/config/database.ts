import { Sequelize } from 'sequelize-typescript';
import { Usuario } from '../models/Usuario';
import { Ambiente } from '../models/Ambiente';
import { Dispositivo } from '../models/Dispositivo';
import { Medicao } from '../models/Medicao';
import { QualidadeEnergia } from '../models/QualidadeEnergia';

import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  models: [Usuario, Ambiente, Dispositivo, Medicao, QualidadeEnergia],
  timezone: '-04:00',
  logging: false, // Desabilita logs de SQL
});

(async () => {
  try {
    await sequelize.sync();
    console.log('Conexão com o banco de dados foi bem-sucedida!');
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
  }
})();
