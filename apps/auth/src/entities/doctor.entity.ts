import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseStaff } from '../constants/classes';
import { User } from '.';

@Entity('Doctors')
export class Doctor extends BaseStaff {
  @Column('varchar', { length: 512 })
  speciality: string;

  @Column('bool', { default: false })
  isApproved: boolean;

  @OneToOne(() => User, (user) => user.doctor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
