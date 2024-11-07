import { Request, Response } from 'express';
import { Medicao } from '../models/Medicao';
import { QualidadeEnergia } from '../models/QualidadeEnergia';
import { Op } from 'sequelize';
import moment from "moment-timezone";

class QualidadeEnergiaController {

  // Calcular indicadores de qualidade de energia para um período específico
  public async calcularQualidadeEnergia(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const usuarioId = (req as any).user.userId;

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'Datas de início e fim são obrigatórias.' });
        return;
      }

      const [inicio, fim] = formatDates(startDate as string, endDate as string);

      const medicoes = await Medicao.findAll({
        where: {
          timestamp: {
            [Op.between]: [inicio, fim],
          },
        },
      });

      if (medicoes.length === 0) {
        res.status(404).json({ error: 'Nenhuma medição encontrada para o período especificado.' });
        return;
      }

      const totalMedicoes = medicoes.length;
      let somaTensao = 0;
      let somaCorrente = 0;
      let somaPotenciaAtiva = 0;

      // Variáveis para os cálculos de THD
      let componentesHarmonicasTensao: number[] = [];
      let componentesHarmonicasCorrente: number[] = [];

      medicoes.forEach(medicao => {
        somaTensao += medicao.tensao;
        somaCorrente += medicao.corrente;
        somaPotenciaAtiva += medicao.potenciaAtiva;
      });

      const mediaTensao = somaTensao / totalMedicoes;
      const mediaCorrente = somaCorrente / totalMedicoes;
      const mediaPotenciaAtiva = somaPotenciaAtiva / totalMedicoes;

      const potenciaAparente = mediaTensao * mediaCorrente;
      const fatorPotencia = potenciaAparente ? (mediaPotenciaAtiva / potenciaAparente) : 0;

      // Cálculo simplificado de THD
      const thdTensao = componentesHarmonicasTensao.length > 0
        ? (Math.sqrt(componentesHarmonicasTensao.reduce((sum, v) => sum + v ** 2, 0)) / mediaTensao) * 100
        : 0;

      const thdCorrente = componentesHarmonicasCorrente.length > 0
        ? (Math.sqrt(componentesHarmonicasCorrente.reduce((sum, i) => sum + i ** 2, 0)) / mediaCorrente) * 100
        : 0;

      const qualidade = await QualidadeEnergia.create({
        usuarioId,
        fatorPotencia,
        flutuacaoTensaoMinima: Math.min(...medicoes.map(m => m.tensao)),
        flutuacaoTensaoMaxima: Math.max(...medicoes.map(m => m.tensao)),
        thdTensao,
        thdCorrente,
        oscilacaoTensao: mediaTensao - Math.min(...medicoes.map(m => m.tensao)),
      });

      // Enviar resposta sem retornar a função
      res.status(201).json(qualidade);
    } catch (error) {
      console.error('Erro ao calcular qualidade de energia:', error);
      res.status(500).json({ error: 'Erro ao calcular qualidade de energia.' });
    }
  }
    
  public async listarQualidadeEnergia(req: Request, res: Response) {
    try {
      const usuarioId = (req as any).user.userId;
      
      const analises = await QualidadeEnergia.findAll({
        where: { usuarioId },
        order: [['timestamp', 'DESC']], // Ordem decrescente por timestamp
      });

      if (analises.length === 0) {
        res.status(404).json({ message: 'Nenhuma análise de qualidade de energia encontrada.' });
        return;
      }

      res.json(analises);
    } catch (error) {
      console.error('Erro ao listar análises de qualidade de energia:', error);
      res.status(500).json({ error: 'Erro ao listar análises de qualidade de energia.' });
    }
  }
}

function formatDates(startDateString: string, endDateString: string) {
  const formattedStartDate = moment.tz(startDateString, "America/Manaus").startOf("day").format();
  const formattedEndDate = moment.tz(endDateString, "America/Manaus").endOf("day").format();

  return [formattedStartDate, formattedEndDate];
}


export default new QualidadeEnergiaController();
