import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from '.';
import { BaseStaffEntity } from './bass-staff.entity';

@Entity('Doctors')
export class Doctor extends BaseStaffEntity {
  @Column('varchar', { length: 512 })
  speciality: string;

  @Column('bool', { default: false })
  isApproved: boolean;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
