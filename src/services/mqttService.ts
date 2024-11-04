import mqtt from 'mqtt';
import { Medicao } from '../models/Medicao';
import { QualidadeEnergia } from '../models/QualidadeEnergia'; // Importe o modelo de QualidadeEnergia

class MqttService {
    private client: mqtt.MqttClient;

    constructor(brokerUrl: string) {
        this.client = mqtt.connect(brokerUrl);

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
            const data = JSON.parse(message.toString());

            const s = data.tensao * data.corrente;
            const p = data.potenciaAtiva;
            const potenciaReativa = Math.sqrt((s * s) - (p * p));

            // Processamento da medição
            const medicao = await Medicao.create({
                dispositivoId: data.dispositivoId,
                timestamp: data.timestamp,
                corrente: data.corrente,
                tensao: data.tensao,
                potenciaAtiva: data.potenciaAtiva,  // Cálculo de potência
                potenciaReativa,
                consumoAcumulado: 0,
            });

        });

        this.client.on('error', (err) => {
            console.error('Erro de conexão:', err);
        });
    }
}

export default MqttService;
