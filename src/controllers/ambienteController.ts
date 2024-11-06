import { Request, Response } from 'express';
import { Ambiente } from '../models/Ambiente';
import { Op } from 'sequelize';
import { Dispositivo } from '../models/Dispositivo';
import { Medicao } from '../models/Medicao';

export const criarAmbiente = async (req: Request, res: Response) => {
  try {
    const { nome } = req.body;
    const usuarioId = req.user.userId
    const ambiente = await Ambiente.create({ nome, usuarioId });
    res.status(201).json(ambiente);
  } catch (error) {
    console.log(error);

    res.status(500).json({ error: 'Erro ao criar ambiente' });
  }
};

export const listarAmbientes = async (req: Request, res: Response) => {
  try {

    const { startDate, endDate } = req.query;

    const [formattedStartDate, formattedendDate] = formatDates(startDate as string, endDate as string);

    // Obtém os ambientes do usuário
    const ambientes = await Ambiente.findAll({
      where: { usuarioId: req.user.userId },
    });

    // Mapeia os ambientes para adicionar a quantidade de dispositivos e a média de consumo do mês
    const resultados = await Promise.all(
      ambientes.map(async (ambiente) => {
        const dispositivos = await Dispositivo.findAll({
          where: { ambienteId: ambiente.id },
        });
        const qtdDispositivos = dispositivos.length;

        const inicioDoMes = new Date(formattedStartDate.getFullYear(), formattedStartDate.getMonth(), 1);
        const ultimoDiaDoMes = new Date(formattedStartDate.getFullYear(), formattedStartDate.getMonth() + 1, 0);
  
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
        var delta_t = 5 / 3600;  // Tempo em horas (5 segundos)
        
        for (let i = 0; i < medicoes.length; i++) {
          // Potência ativa em W
          let potenciaAtiva = medicoes[i].potenciaAtiva;
        
          // Converte a potência ativa para kW
          let potenciaAtivakW = potenciaAtiva / 1000;
        
          // Calcula o consumo de energia (em kWh) durante o intervalo de 5 segundos
          let consumoIntervalo = potenciaAtivakW * delta_t;
        
          // Acumula o consumo total de energia em kWh
          consumoAcumuladokWh += consumoIntervalo;
        }
        // Obtém o total de medições do mês para calcular a média
        // const totalMedicoes = await Medicao.count({
        //   where: {
        //     dispositivoId: {
        //       [Op.in]: dispositivos.map(dispositivo => dispositivo.macAddress),
        //     },
        //     timestamp: {
        //       [Op.gte]: inicioDoMes,
        //     },
        //   },
        // });

        // const mediaConsumo = totalMedicoes > 0 ? consumoMes / totalMedicoes : 0;
        // const mediaConsumo = consumoAcumuladokWh;

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


// export const listarAmbientes = async (req: Request, res: Response) => {
//   try {    
//     const ambientes = await Ambiente.findAll({ where: { usuarioId: req.user.userId } });
//     res.json(ambientes);
//   } catch (error) {
//     console.log(error);

//     res.status(500).json({ error: 'Erro ao listar ambientes' });
//   }

// };

export const atualizarAmbiente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome } = req.body;

    const ambiente = await Ambiente.findByPk(id);

    if (!ambiente) {
      res.status(404).json({ error: 'Ambiente não encontrado' });
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
  // Cria o objeto Date para a data de início (meia-noite)
  const formattedStartDate = new Date(startDateString);
  formattedStartDate.setHours(0, 0, 0, 0); // Define para 00:00:00.000

  // Cria o objeto Date para a data de fim (23:59:59.999 do dia anterior à meia-noite)
  const formattedEndDate = new Date(endDateString);
  formattedEndDate.setHours(23, 59, 59, 999); // Define para 23:59:59.999

  // Retorna um array com as datas formatadas
  return [formattedStartDate, formattedEndDate];
}
