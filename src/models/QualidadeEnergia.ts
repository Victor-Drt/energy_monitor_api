import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Medicao } from './Medicao';

@Table({ tableName: 'qualidade_energia', timestamps: false })
export class QualidadeEnergia extends Model {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  id!: string;

  @ForeignKey(() => Medicao)
  @Column({ type: DataType.UUID, allowNull: false })
  medicaoId!: string;

  @Column({ type: DataType.FLOAT, allowNull: false })
  fatorPotencia!: number;

  @Column({ type: DataType.FLOAT, allowNull: false })
  flutuacaoTensaoMinima!: number;

  @Column({ type: DataType.FLOAT, allowNull: false })
  flutuacaoTensaoMaxima!: number;

  @Column({ type: DataType.FLOAT, allowNull: true })
  thdTensao!: number;

  @Column({ type: DataType.FLOAT, allowNull: true })
  thdCorrente!: number;

  @Column({ type: DataType.FLOAT, allowNull: true })
  oscilacaoTensao!: number;
}
