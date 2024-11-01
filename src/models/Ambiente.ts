import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { Usuario } from './Usuario';
import { Dispositivo } from './Dispositivo';

@Table({ tableName: 'ambientes', timestamps: false })
export class Ambiente extends Model {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  id!: string; // Identificador único do ambiente

  @ForeignKey(() => Usuario)
  @Column({ type: DataType.UUID, allowNull: false })
  usuarioId!: string; // Chave estrangeira para o usuário que criou o ambiente

  @Column({ type: DataType.STRING, allowNull: false })
  nome!: string; // Nome do ambiente

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  dataCriacao!: Date; // Data de criação do ambiente

}
