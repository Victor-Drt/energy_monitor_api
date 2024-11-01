import { Request, Response } from 'express';
import { Ambiente } from '../models/Ambiente';
import { Op } from 'sequelize';
import { Dispositivo } from '../models/Dispositivo';
import { Medicao } from '../models/Medicao';

export const criarAmbiente = async (req: Request, res: Response) => {
  try {
    const { nome} = req.body;
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
    // Obtém os ambientes do usuário
    const ambientes = await Ambiente.findAll({
      where: { usuarioId: req.user.userId },
    });

    // Mapeia os ambientes para adicionar a quantidade de dispositivos e a média de consumo do mês
    const resultados = await Promise.all(
      ambientes.map(async (ambiente) => {
        // Calcula a quantidade de dispositivos diretamente
        const dispositivos = await Dispositivo.findAll({
          where: { ambienteId: ambiente.id },
        });
        const qtdDispositivos = dispositivos.length;

        // Calcula a média de consumo do mês (ajuste o campo de acordo com seu modelo)
        const inicioDoMes = new Date();
        inicioDoMes.setDate(1); // Primeiro dia do mês
        const consumoMes = await Medicao.sum('consumoAcumulado', {
          where: {
            dispositivoId: {
              [Op.in]: dispositivos.map(dispositivo => dispositivo.macAddress), // Use macAddress como ID
            },
            timestamp: {
              [Op.gte]: inicioDoMes,
            },
          },
        });

        // Obtém o total de medições do mês para calcular a média
        const totalMedicoes = await Medicao.count({
          where: {
            dispositivoId: {
              [Op.in]: dispositivos.map(dispositivo => dispositivo.macAddress),
            },
            timestamp: {
              [Op.gte]: inicioDoMes,
            },
          },
        });

        const mediaConsumo = totalMedicoes > 0 ? consumoMes / totalMedicoes : 0;

        return {
          ...ambiente.toJSON(), // Retorna os dados do ambiente
          qtdDispositivos,
          mediaConsumo,
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
