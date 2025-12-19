import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from '.';
import { BaseStaff } from '../constants';

@Entity('Admins')
export class Admin extends BaseStaff {
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
