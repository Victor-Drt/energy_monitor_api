import {
  Table,
  Column,
  Model,
  DataType,
  BeforeCreate
} from 'sequelize-typescript';
import * as bcrypt from 'bcryptjs'; // Alterado para bcryptjs

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
    if (usuario.senha) {
      usuario.senha = await bcrypt.hash(usuario.senha, 10);
    } else {
      throw new Error('A senha não pode ser nula ou vazia.');
    }
  }

  // Método para verificar a senha
  async checkPassword(senha: string): Promise<boolean> {
    return bcrypt.compare(senha, this.senha);
  }
}
