import { Request, Response } from 'express';
import { Ambiente } from '../models/Ambiente';

export const criarAmbiente = async (req: Request, res: Response) => {
  try {
    const { nome, usuarioId } = req.body;
    const ambiente = await Ambiente.create({ nome, usuarioId });
    res.status(201).json(ambiente);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar ambiente' });
  }
};

export const listarAmbientes = async (req: Request, res: Response) => {
  try {    
    const ambientes = await Ambiente.findAll({ where: { usuarioId: req.user.userId } });
    res.json(ambientes);
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
