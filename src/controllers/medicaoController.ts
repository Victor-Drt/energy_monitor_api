import { Request, Response } from 'express';
import { Medicao } from '../models/Medicao';
import { Op, fn, col, literal } from 'sequelize';
import { Ambiente } from '../models/Ambiente';
import { Dispositivo } from '../models/Dispositivo';
import moment from "moment-timezone";

class MedicaoController {

  // Listar medições em ordem da mais recente para a mais antiga em um determinado período
  public async listarMedicoes(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const [formattedStartDate, formattedendDate] = formatDates(startDate as string, endDate as string);

      const { macAddress } = req.params;
      const userId = req.user.userId; // userId extraído do token pelo middleware de autenticação

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
      const usuarioId = req.user.userId;

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

      const userId = req.user.userId;

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
