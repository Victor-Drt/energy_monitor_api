import { Request, Response } from 'express';
import { Medicao } from '../models/Medicao';
import { Op, fn, col, literal } from 'sequelize';
import { Ambiente } from '../models/Ambiente';
import { Dispositivo } from '../models/Dispositivo';

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
                    hora: medicao.timestamp.toISOString().substr(11, 8), // Obtém a hora no formato HH:mm:ss
                }));

            dispositivosResultado.push({
                nome: dispositivoNome,
                medicoes: medicoesDoDispositivo,
            });
        });

        res.json({ dispositivos: dispositivosResultado });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar as medições. ' + error });
    }
}

  public async obterEstatisticas(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const [formattedStartDate, formattedendDate] = formatDates(startDate as string, endDate as string);

      const userId = req.user.userId; // userId extraído do token pelo middleware de autenticação

      const hoje = formattedStartDate;
      const inicioDoDia = formattedStartDate;
      const inicioDaSemana = new Date(hoje.setDate(hoje.getDate() - hoje.getDay()));
      const inicioDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

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
      const consumoDiario = await Medicao.sum('consumoAcumulado', {
        where: {
          timestamp: { [Op.gte]: inicioDoDia },
          dispositivoId: { [Op.in]: dispositivoIds },
        },
      });

      // Calcula o consumo semanal
      const consumoSemanal = await Medicao.sum('consumoAcumulado', {
        where: {
          timestamp: { [Op.gte]: inicioDaSemana },
          dispositivoId: { [Op.in]: dispositivoIds },
        },
      });

      // Calcula o consumo mensal
      const consumoMensal = await Medicao.sum('consumoAcumulado', {
        where: {
          timestamp: { [Op.gte]: inicioDoMes },
          dispositivoId: { [Op.in]: dispositivoIds },
        },
      });

      // Conta a quantidade de ambientes
      const quantidadeAmbientes = ambientes.length;

      // Calcula a tensão média
      const tensaoMedia = await Medicao.findOne({
        where: { dispositivoId: { [Op.in]: dispositivoIds } },
        attributes: [[fn('AVG', col('tensao')), 'tensaoMedia']],
      });

      res.json({
        consumoDiario,
        consumoSemanal,
        consumoMensal,
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
  // Cria o objeto Date para a data de início (meia-noite)
  const formattedStartDate = new Date(startDateString);
  formattedStartDate.setHours(0, 0, 0, 0); // Define para 00:00:00.000

  // Cria o objeto Date para a data de fim (23:59:59.999 do dia anterior à meia-noite)
  const formattedEndDate = new Date(endDateString);
  formattedEndDate.setHours(23, 59, 59, 999); // Define para 23:59:59.999

  // Retorna um array com as datas formatadas
  return [formattedStartDate, formattedEndDate];
}


export default new MedicaoController();
