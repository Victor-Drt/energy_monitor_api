import { Request, Response } from 'express';
import { Dispositivo } from '../models/Dispositivo';

export const criarDispositivo = async (req: Request, res: Response) => {
  try {
    const dataAtivacao = new Date(); 
    const { ambienteId, macAddress, descricao } = req.body;
    const dispositivo = await Dispositivo.create({ ambienteId, macAddress, descricao, status: true, dataAtivacao });
    res.status(201).json(dispositivo);
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ error: 'Erro ao criar dispositivo' });
  }
};

export const listarDispositivos = async (req: Request, res: Response) => {
  try {
    const dispositivos = await Dispositivo.findAll({ where: { ambienteId: req.params.ambienteId } });
    res.json(dispositivos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar dispositivos' });
  }
};
