import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from '.';
import { BaseStaff } from '../constants/classes';

@Entity('Admins')
export class Admin extends BaseStaff {
  @OneToOne(() => User, (user) => user.admin, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
