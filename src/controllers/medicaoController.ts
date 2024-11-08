import { Request, Response } from 'express';
import { Medicao } from '../models/Medicao';
import { Op, fn, col, literal, Sequelize } from 'sequelize';
import { Ambiente } from '../models/Ambiente';
import { Dispositivo } from '../models/Dispositivo';
import moment from "moment-timezone";

class MedicaoController {

  public async obterTensaoPorHora(req: Request, res: Response) {
    try {
      const { dia } = req.query;
      const userId = (req as any).user.userId; // Obtendo o userId do token
  
      // Iniciar e finalizar o dia em formato ISO
      const startOfDay = moment.tz(dia as string, 'America/Manaus').utc().startOf('day').toISOString();
      const endOfDay = moment.tz(dia as string, 'America/Manaus').utc().endOf('day').toISOString();
  
      // Buscar os ambientes do usuário
      const ambientes = await Ambiente.findAll({
        where: { usuarioId: userId },
        attributes: ['id'],
      });
  
      const ambienteIds = ambientes.map((ambiente) => ambiente.id);
  
      // Buscar os dispositivos dos ambientes do usuário
      const dispositivos = await Dispositivo.findAll({
        where: {
          ambienteId: { [Op.in]: ambienteIds },
        },
        attributes: ['id', 'macAddress', 'descricao'],
      });
  
      const dispositivosIds = dispositivos.map((dispositivo) => dispositivo.macAddress);
  
      // Buscar as medições para os dispositivos no intervalo de tempo
      const medicoes = await Medicao.findAll({
        attributes: [
          [Sequelize.literal(`to_char(timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS')`), 'timestamp'],
          'tensao',
          'dispositivoId',
        ],
        where: {
          dispositivoId: { [Op.in]: dispositivosIds },
          timestamp: { [Op.between]: [startOfDay, endOfDay] },
        },
      });
  
      // Inicializando o objeto de resultados
      const resultados: Record<string, { nome: string; registros: Array<{ hora: string; tensaoMedia: number }> }> = {};
  
      // Objeto intermediário para cálculos
      const calculos: Record<string, { totalTensao: number; count: number }> = {};
  
      // Agrupar as medições por dispositivo e hora
      medicoes.forEach((medicao) => {
        const hora = moment(medicao.timestamp).startOf('hour').format('YYYY-MM-DD HH:00');
        const tensao = medicao.tensao;
        const dispositivo = dispositivos.find((d) => d.macAddress === medicao.dispositivoId);
  
        if (dispositivo) {
          const dispositivoNome = dispositivo.descricao || dispositivo.macAddress;
  
          if (!resultados[dispositivoNome]) {
            resultados[dispositivoNome] = { nome: dispositivoNome, registros: [] };
          }
  
          // Chave única para identificar dispositivo + hora
          const chave = `${dispositivoNome}_${hora}`;
  
          // Inicializa o cálculo se não existir
          if (!calculos[chave]) {
            calculos[chave] = { totalTensao: 0, count: 0 };
          }
  
          // Acumula a tensão e incrementa o contador
          calculos[chave].totalTensao += tensao;
          calculos[chave].count += 1;
        }
      });
  
      // Processar os cálculos para cada dispositivo
      Object.keys(calculos).forEach((chave) => {
        const [dispositivoNome, hora] = chave.split('_');
        const { totalTensao, count } = calculos[chave];
  
        const tensaoMedia = totalTensao / count;
  
        // Adiciona o registro na resposta final
        resultados[dispositivoNome].registros.push({
          hora,
          tensaoMedia,
        });
      });
  
      // Transformar o objeto de resultados para a resposta final
      const resposta = Object.values(resultados);
  
      // Retornar a resposta
      res.json(resposta);
    } catch (error) {
      console.error('Erro:', error);
      res.status(500).json({ error: 'Erro ao obter a tensão por hora.' });
    }
  }
  
  public async obterConsumoPorHora(req: Request, res: Response) {
    try {
      const { dia } = req.query;
      const userId = (req as any).user.userId;  // Obtendo o userId do token

      // Iniciar e finalizar o dia em formato ISO
      const startOfDay = moment.tz(dia as string, 'America/Manaus').utc().startOf('day').toISOString();
      const endOfDay = moment.tz(dia as string, 'America/Manaus').utc().endOf('day').toISOString();

      // Buscar os ambientes do usuário
      const ambientes = await Ambiente.findAll({
        where: { usuarioId: userId }, // Filtrando os ambientes do usuário
        attributes: ['id'], // Buscando apenas os IDs dos ambientes
      });

      const ambienteIds = ambientes.map(ambiente => ambiente.id); // IDs dos ambientes do usuário

      // Buscar os dispositivos dos ambientes do usuário
      const dispositivos = await Dispositivo.findAll({
        where: {
          ambienteId: { [Op.in]: ambienteIds },  // Filtrando pelos ambientes do usuário
        },
        attributes: ['id', 'macAddress', 'descricao'], // Inclui id, macAddress e descricao
      });

      const dispositivosIds = dispositivos.map(dispositivo => dispositivo.macAddress);  // IDs dos dispositivos do usuário

      // Buscar as medições para os dispositivos no intervalo de tempo
      const medicoes = await Medicao.findAll({
        attributes: [[Sequelize.literal(`to_char(timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS')`), 'timestamp'], 'potenciaAtiva', 'dispositivoId'], // Atributos necessários
        where: {
          dispositivoId: { [Op.in]: dispositivosIds },  // Filtra pelas medições dos dispositivos
          timestamp: { [Op.between]: [startOfDay, endOfDay] }, // Dentro do intervalo de tempo
        },
      });

      // Inicializando o objeto de resultados
      const resultados: Record<string, { nome: string, registros: Array<{ hora: string, potenciaTotalKw: number }> }> = {};

      // Agrupar as medições por dispositivo e hora
      medicoes.forEach(medicao => {
        const hora = moment(medicao.timestamp).startOf('hour').format('YYYY-MM-DD HH:00');
        const potenciaAtiva = medicao.potenciaAtiva;
        const dispositivo = dispositivos.find(d => d.macAddress === medicao.dispositivoId);
        
        if (dispositivo) {
          const dispositivoNome = dispositivo.descricao || dispositivo.macAddress;  // Nome do dispositivo

          if (!resultados[dispositivoNome]) {
            resultados[dispositivoNome] = { nome: dispositivoNome, registros: [] };
          }

          // Verifica se já existe um registro para essa hora
          const registroExistente = resultados[dispositivoNome].registros.find(r => r.hora === hora);

          if (registroExistente) {
            // Se já existir, soma a potência
            registroExistente.potenciaTotalKw += potenciaAtiva / 1000;  // Convertendo para kW
          } else {
            // Caso contrário, cria um novo registro
            resultados[dispositivoNome].registros.push({
              hora,
              potenciaTotalKw: potenciaAtiva / 1000,  // Convertendo para kW
            });
          }
        }
      });

      // Transformar o objeto de resultados para a resposta final
      const resposta = Object.values(resultados);

      // Retornar a resposta
      res.json(resposta);

    } catch (error) {
      console.error('Erro:', error);
      res.status(500).json({ error: 'Erro ao obter o consumo por hora.' });
    }
  }

  public async listarMedicoes(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const [formattedStartDate, formattedendDate] = formatDates(startDate as string, endDate as string);

      const { macAddress } = req.params;
      const userId = (req as any).user.userId;

      const medicoes = await Medicao.findAll({
        where: {
          dispositivoId: macAddress, // Agora utiliza macAddress do parâmetro
          timestamp: {
            [Op.between]: [new Date(formattedStartDate), new Date(formattedendDate)],
          },
        },
        order: [['timestamp', 'DESC']],
      });

      res.json(medicoes);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar as medições.' });
    }
  }

  public async listarMedicoesPorAmbiente(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const { ambienteId } = req.params;
      const usuarioId = (req as any).user.userId;

      // Formatar as datas de início e fim
      const [formattedStartDate, formattedEndDate] = formatDates(startDate as string, endDate as string);

      // Buscar os dispositivos associados ao ambiente
      const dispositivos = await Dispositivo.findAll({
        where: { ambienteId: ambienteId },
        attributes: ['macAddress', 'descricao'], // Incluindo o nome do dispositivo
      });

      // Extrair IDs de dispositivos
      const dispositivoIds = dispositivos.map(dispositivo => dispositivo.macAddress);

      // Buscar as medições
      const medicoes = await Medicao.findAll({
        where: {
          dispositivoId: { [Op.in]: dispositivoIds },
          timestamp: {
            [Op.between]: [new Date(formattedStartDate), new Date(formattedEndDate)],
          },
        },
        order: [['timestamp', 'DESC']],
      });

      // Estruturar o resultado agrupando por dispositivo
      const dispositivosResultado: any[] = [];

      // Agrupar as medições por dispositivo
      dispositivos.forEach(dispositivo => {
        const dispositivoNome = dispositivo.descricao || `Dispositivo ${dispositivo.macAddress}`;
        const medicoesDoDispositivo = medicoes
          .filter(medicao => medicao.dispositivoId === dispositivo.macAddress)
          .map(medicao => ({
            potenciaAtivaKw: medicao.potenciaAtiva / 1000, // Supondo que a propriedade no modelo seja `potenciaAtiva`
            hora: medicao.timestamp, // Obtém a hora no formato HH:mm:ss
          }));

        dispositivosResultado.push({
          nome: dispositivoNome,
          registrosConsumo: medicoesDoDispositivo,
        });
      });

      res.json({ devices: dispositivosResultado });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar as medições. ' + error });
    }
  }

  public async obterEstatisticas(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const [formattedStartDate, formattedEndDate] = formatDates(startDate as string, endDate as string);

      const userId = (req as any).user.userId;

      const hoje = moment.tz(startDate as string, "America/Manaus");

      const inicioDaSemana = hoje.clone().startOf("week").toISOString();
      const ultimoDiaDaSemana = hoje.clone().endOf("week").toISOString();
      const inicioDoMes = hoje.clone().startOf("month").toISOString();
      const ultimoDiaDoMes = hoje.clone().endOf("month").toISOString();

      // Encontra todos os ambientes do usuário
      const ambientes = await Ambiente.findAll({
        where: { usuarioId: userId },
        attributes: ['id'],
      });

      // Extrai IDs dos ambientes do usuário
      const ambienteIds = ambientes.map(ambiente => ambiente.id);

      // Encontra os dispositivos nos ambientes do usuário
      const dispositivos = await Dispositivo.findAll({
        where: { ambienteId: { [Op.in]: ambienteIds } },
        attributes: ['macAddress'],
      });

      // Extrai IDs de dispositivos
      const dispositivoIds = dispositivos.map(dispositivo => dispositivo.macAddress);

      // Calcula o consumo diário
      const consumoDiario = await Medicao.sum('potenciaAtiva', {
        where: {
          timestamp: { [Op.between]: [formattedStartDate, formattedEndDate] },
          dispositivoId: { [Op.in]: dispositivoIds },
        },
      });

      const consumoSemanal = await Medicao.sum('potenciaAtiva', {
        where: {
          timestamp: { [Op.between]: [inicioDaSemana, ultimoDiaDaSemana] },
          dispositivoId: { [Op.in]: dispositivoIds },
        },
      }) || 0.00;

      const consumoMensal = await Medicao.sum('potenciaAtiva', {
        where: {
          timestamp: { [Op.between]: [inicioDoMes, ultimoDiaDoMes] },
          dispositivoId: { [Op.in]: dispositivoIds },
        },
      }) || 0.00;

      const quantidadeAmbientes = ambientes.length;

      const tensaoMedia = await Medicao.findOne({
        where: { dispositivoId: { [Op.in]: dispositivoIds }, timestamp: { [Op.between]: [inicioDoMes, ultimoDiaDoMes] } },
        attributes: [[fn('AVG', col('tensao')), 'tensaoMedia']],
      });

      res.json({
        consumoDiario: consumoDiario / 1000,
        consumoSemanal: consumoSemanal / 1000,
        consumoMensal: consumoMensal / 1000,
        quantidadeAmbientes,
        tensaoMedia: tensaoMedia?.getDataValue('tensaoMedia') || 0,
      });

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({ error: 'Erro ao obter estatísticas.' });
    }
  }
}

function formatDates(startDateString: string, endDateString: string) {
  const formattedStartDate = moment.tz(startDateString, "America/Manaus").startOf("day").format();
  const formattedEndDate = moment.tz(endDateString, "America/Manaus").endOf("day").format();

  return [formattedStartDate, formattedEndDate];
}

export default new MedicaoController();
