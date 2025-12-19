import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from '.';
import { BaseStaff } from '../constants';

@Entity('Doctors')
export class Doctor extends BaseStaff {
  @Column('varchar', { length: 512 })
  speciality: string;

  @Column('bool', { default: false })
  isApproved: boolean;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
