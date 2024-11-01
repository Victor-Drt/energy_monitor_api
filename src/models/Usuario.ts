import { Table, Column, Model, DataType, HasMany, BeforeCreate } from 'sequelize-typescript';
import { Ambiente } from './Ambiente';
import * as bcrypt from 'bcrypt';

@Table({ tableName: 'usuarios', timestamps: false })
export class Usuario extends Model {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  id!: string;

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  email!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  senha!: string;

  // Antes de criar o usuário, fazer hash da senha
  @BeforeCreate
  static async hashPassword(usuario: Usuario) {
    usuario.senha = await bcrypt.hash(usuario.senha, 10);
  }

  // Método para verificar a senha
  async checkPassword(senha: string): Promise<boolean> {
    return bcrypt.compare(senha, this.senha);
  }
}
