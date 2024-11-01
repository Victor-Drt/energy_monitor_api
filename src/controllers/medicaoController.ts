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
      const { macAddress } = req.params;
      const userId = req.user.userId; // userId extraído do token pelo middleware de autenticação
  
      const medicoes = await Medicao.findAll({
        where: {
          dispositivoId: macAddress, // Agora utiliza macAddress do parâmetro
          timestamp: {
            [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
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
      const userId = req.user.userId; // userId extraído do token pelo middleware de autenticação
  
      const dispositivos = await Dispositivo.findAll({
        where: { ambienteId: ambienteId },
        attributes: ['macAddress'],
      });
      
      // Extrai IDs de dispositivos
      const dispositivoIds = dispositivos.map(dispositivo => dispositivo.macAddress);


      const medicoes = await Medicao.findAll({
        where: {
          dispositivoId: {[Op.in]: dispositivoIds}, // Agora utiliza macAddress do parâmetro
          timestamp: {
            [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
          },
        },
        order: [['timestamp', 'DESC']],
      });
  
      res.json(medicoes);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar as medições.' });
    }
  }

  
  // Obter consumo total diário, semanal, e mensal, quantidade de ambientes e tensão média  
  public async obterEstatisticas(req: Request, res: Response) {
    try {
      const userId = req.user.userId; // userId extraído do token pelo middleware de autenticação
        
      const hoje = new Date();
      const inicioDoDia = new Date(hoje.setHours(0, 0, 0, 0));
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

export default new MedicaoController();
