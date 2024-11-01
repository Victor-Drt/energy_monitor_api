import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { Ambiente } from './Ambiente';
import { Medicao } from './Medicao';

@Table({ tableName: 'dispositivos', timestamps: false })
export class Dispositivo extends Model {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  id!: string;

  // @ForeignKey(() => Ambiente)
  @Column({ type: DataType.UUID, allowNull: false })
  ambienteId!: string;

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  macAddress!: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  status!: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  descricao!: string;

  @Column({ type: DataType.DATE, allowNull: true })
  dataAtivacao!: Date;

}
