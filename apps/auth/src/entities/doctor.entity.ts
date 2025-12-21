import { Column, Entity } from 'typeorm';
import { BaseStaffEntity } from './bass-staff.entity';

@Entity('Doctors')
export class Doctor extends BaseStaffEntity {
  @Column('varchar', { length: 512 })
  speciality: string;

  @Column('bool', { default: false })
  isApproved: boolean;
}
