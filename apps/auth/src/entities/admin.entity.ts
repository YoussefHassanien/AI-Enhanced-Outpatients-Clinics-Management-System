import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from '.';
import { BaseStaffEntity } from './bass-staff.entity';

@Entity('Admins')
export class Admin extends BaseStaffEntity {
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
