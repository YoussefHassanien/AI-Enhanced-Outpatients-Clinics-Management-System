import { Column, Entity, Index } from 'typeorm';
import { BaseStaffEntity } from './base-staff.entity';

@Entity('Doctors')
export class Doctor extends BaseStaffEntity {
  @Column('varchar', { length: 512 })
  speciality: string;

  @Column('bool', { default: false })
  isApproved: boolean;

  @Column('integer', { nullable: false })
  @Index()
  clinicId: number;
}
