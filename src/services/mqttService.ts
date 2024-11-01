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

            // Processamento da medição
            const medicao = await Medicao.create({
                dispositivoId: data.dispositivoId,
                corrente: data.corrente,
                tensao: data.tensao,
                potenciaAtiva: data.potenciaAtiva,  // Cálculo de potência
                consumoAcumulado: data.corrente * data.tensao / 1000,  // Cálculo de potência
                // timestamp: data.timestamp,
            });

            // Cálculo dos parâmetros de qualidade
            const qualidadeEnergia = this.calcularQualidade(data);

            // Armazena os dados de qualidade no banco de dados
            await QualidadeEnergia.create({
                medicaoId: medicao.id,
                fatorPotencia: qualidadeEnergia.fatorPotencia,
                flutuacaoTensaoMinima: 0, // Inicializa como 0
                flutuacaoTensaoMaxima: 0, // Inicializa como 0
                thdTensao: 0, // Inicializa como 0
                thdCorrente: 0, // Inicializa como 0
                oscilacaoTensao: 0, // Inicializa como 0
            });
        });

        this.client.on('error', (err) => {
            console.error('Erro de conexão:', err);
        });
    }

    private calcularQualidade(data: any) {
        // Exemplo de cálculos - ajuste conforme necessário
        const fatorPotencia = this.calcularFatorPotencia(data.corrente, data.tensao);
        const flutuacaoTensaoMinima = 0; // Inicializa como 0
        const flutuacaoTensaoMaxima = 0; // Inicializa como 0
        const thdTensao = 0; // Inicializa como 0
        const thdCorrente = 0; // Inicializa como 0
        const oscilacaoTensao = 0; // Inicializa como 0

        return {
            fatorPotencia,
            flutuacaoTensaoMinima,
            flutuacaoTensaoMaxima,
            thdTensao,
            thdCorrente,
            oscilacaoTensao,
        };
    }

    private calcularFatorPotencia(corrente: number, tensao: number): number {
        // Implementar cálculo do fator de potência
        return corrente * tensao; // Exemplo simplificado
    }

    private calcularFlutuacaoTensaoMinima(tensao: number): number {
        // Implementar cálculo da flutuação de tensão mínima
        return tensao - 0.1; // Exemplo simplificado
    }

    private calcularFlutuacaoTensaoMaxima(tensao: number): number {
        // Implementar cálculo da flutuação de tensão máxima
        return tensao + 0.1; // Exemplo simplificado
    }

    private calcularTHD(tensao: number): number {
        // Implementar cálculo do THD (Total Harmonic Distortion)
        return 0.05; // Exemplo simplificado
    }

    private calcularOscilacaoTensao(tensao: number): number {
        // Implementar cálculo da oscilação de tensão
        return tensao * 0.02; // Exemplo simplificado
    }
}

export default MqttService;
