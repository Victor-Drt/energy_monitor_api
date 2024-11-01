import express from 'express';
import dotenv from 'dotenv';
import { sequelize } from './config/database';
import ambienteRoutes from './routes/ambienteRoutes';
import dispositivoRoutes from './routes/dispositivoRoutes';
import apiRoutes from './routes/api';
import MqttService from './services/mqttService';
import medicaoRoutes from './routes/medicaoRoutes';

dotenv.config();

const app = express();
app.use(express.json());

// Conectar ao banco de dados
sequelize.sync()
    .then(() => {
        console.log('Banco de dados conectado com sucesso!');

        // Iniciar o serviço MQTT após a conexão com o banco de dados
        const mqttService = new MqttService(process.env.MQTT_BROKER_URL!);
    })
    .catch((error) => console.error('Erro ao conectar ao banco de dados:', error));

// Rotas
app.use('/ambientes', ambienteRoutes);
app.use('/medicoes', medicaoRoutes);
app.use('/dispositivos', dispositivoRoutes);
app.use('/auth', apiRoutes);

// Inicialização do servidor
const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});