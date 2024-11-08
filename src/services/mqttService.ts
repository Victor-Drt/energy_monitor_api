import mqtt from 'mqtt';
import { Medicao } from '../models/Medicao';
import { QualidadeEnergia } from '../models/QualidadeEnergia'; // Importe o modelo de QualidadeEnergia

class MqttService {
    private client: mqtt.MqttClient;

    constructor(brokerUrl: string) {
        this.client = mqtt.connect(brokerUrl, {
            connectTimeout: 30000,
            reconnectPeriod: 5000, // Tentar reconectar a cada 5 segundos
        });

        this.client.on('connect', () => {
            console.log('Conectado ao broker MQTT', brokerUrl);
            this.client.subscribe('energy/medicao', (err) => {
                if (err) {
                    console.error('Erro ao se inscrever no tópico:', err);
                } else {
                    console.log('Inscrito no tópico: energy/medicao');
                }
            });
        });

        this.client.on('message', async (topic, message) => {
            try {
                const data = JSON.parse(message.toString());

                const s = data.tensao * data.corrente;
                const p = data.potenciaAtiva;
                const potenciaReativa = data.tensao * data.corrente;

                // Processamento da medição
                const medicao = await Medicao.create({
                    dispositivoId: data.dispositivoId,
                    timestamp: data.timestamp,
                    corrente: data.corrente,
                    tensao: data.tensao,
                    potenciaAtiva: data.potenciaAtiva,
                    potenciaReativa,
                    consumoAcumulado: 0,
                });
            } catch (error) {
                console.error('Erro ao processar a mensagem:', error);
            }
        });

        this.client.on('error', (err) => {
            console.error('Erro de conexão:', err);
        });

        this.client.on('close', () => {
            console.warn('Conexão com o broker MQTT foi fechada.');
        });
    }
}

export default MqttService;
