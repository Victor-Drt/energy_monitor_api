import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';

@Table({ tableName: 'medicoes', timestamps: false })
export class Medicao extends Model {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  id!: string;

  @Column({ type: DataType.STRING(17), allowNull: false }) 
  dispositivoId!: string; 
  
  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  timestamp!: Date;

  @Column({ type: DataType.FLOAT, allowNull: false })
  corrente!: number;

  @Column({ type: DataType.FLOAT, allowNull: false })
  tensao!: number;

  @Column({ type: DataType.FLOAT, allowNull: false })
  potenciaAtiva!: number;

  @Column({ type: DataType.FLOAT, allowNull: false })
  potenciaReativa!: number;

  @Column({ type: DataType.FLOAT, allowNull: true })
  consumoAcumulado!: number;

}
