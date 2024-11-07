import { Request, Response } from 'express';
import { Ambiente } from '../models/Ambiente';
import { Op } from 'sequelize';
import { Dispositivo } from '../models/Dispositivo';
import { Medicao } from '../models/Medicao';
import moment from "moment-timezone";

export const criarAmbiente = async (req: Request, res: Response) => {
  try {
    const { nome } = req.body;
    const usuarioId = (req as any).user.userId;
    const ambiente = await Ambiente.create({ nome, usuarioId });
    res.status(201).json(ambiente);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar ambiente' });
  }
};

export const listarAmbientes = async (req: Request, res: Response) => {
  try {

    const { startDate, endDate } = req.query;
    const usuarioId = (req as any).user.userId;

    const [formattedStartDate, formattedendDate] = formatDates(startDate as string, endDate as string);

    // Obtém os ambientes do usuário
    const ambientes = await Ambiente.findAll({
      where: { usuarioId: usuarioId },
    });

    // Mapeia os ambientes para adicionar a quantidade de dispositivos e a média de consumo do mês
    const resultados = await Promise.all(
      ambientes.map(async (ambiente) => {
        const dispositivos = await Dispositivo.findAll({
          where: { ambienteId: ambiente.id },
        });
        const qtdDispositivos = dispositivos.length;

        const formattedStartDate = moment.tz(startDate, "America/Manaus");

        const inicioDoMes = formattedStartDate.clone().startOf('month');
        const ultimoDiaDoMes = formattedStartDate.clone().endOf('month');
          
        const medicoes = await Medicao.findAll({
          where: {
            dispositivoId: {
              [Op.in]: dispositivos.map(dispositivo => dispositivo.macAddress), // Use macAddress como ID
            },
            timestamp: {
              [Op.between]: [inicioDoMes, ultimoDiaDoMes],
            },
          },
        });

        var consumoAcumuladokWh = 0;

        for (let i = 0; i < medicoes.length; i++) {
          // Potência ativa em W (watts)
          let potenciaAtiva = medicoes[i].potenciaAtiva;
        
          // Converte a potência ativa de W para kW (dividindo por 1000)
          let potenciaAtivakW = potenciaAtiva / 1000;
        
          // Soma a potência ativa convertida para kW
          consumoAcumuladokWh += potenciaAtivakW;
        }

        return {
          ...ambiente.toJSON(), // Retorna os dados do ambiente
          consumoAcumuladokWh,
          qtdDispositivos,
          // mediaConsumo,
        };
      })
    );

    res.json(resultados);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Erro ao listar ambientes' });
  }
};

export const atualizarAmbiente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome } = req.body;

    const ambiente = await Ambiente.findByPk(id);

    if (!ambiente) {
      res.status(404).json({ error: 'Ambiente não encontrado' });
      return;
    } else {
      ambiente.nome = nome || ambiente.nome;
      await ambiente.save();
    }


    res.json({ message: 'Ambiente atualizado com sucesso', ambiente });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar ambiente' });
  }
};

// Deletar ambiente
export const deletarAmbiente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const ambiente = await Ambiente.findByPk(id);

    if (!ambiente) {
      res.status(404).json({ error: 'Ambiente não encontrado' });
      return;
    } else {
      await ambiente.destroy();
    }

    res.json({ message: 'Ambiente deletado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar ambiente' });
  }
};

function formatDates(startDateString: string, endDateString: string) {
  const formattedStartDate = moment.tz(startDateString, "America/Manaus").startOf("day").format();
  const formattedEndDate = moment.tz(endDateString, "America/Manaus").endOf("day").format();

  return [formattedStartDate, formattedEndDate];
}

// function formatDates(startDateString: string, endDateString: string) {
//   // Cria o objeto Date para a data de início (meia-noite)
//   const formattedStartDate = new Date(startDateString);
//   formattedStartDate.setHours(0, 0, 0, 0); // Define para 00:00:00.000

//   // Cria o objeto Date para a data de fim (23:59:59.999 do dia anterior à meia-noite)
//   const formattedEndDate = new Date(endDateString);
//   formattedEndDate.setHours(23, 59, 59, 999); // Define para 23:59:59.999

//   // Retorna um array com as datas formatadas
//   return [formattedStartDate, formattedEndDate];
// }