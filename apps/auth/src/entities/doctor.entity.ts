import { Column, Entity } from 'typeorm';
import { BaseStaffEntity } from './base-staff.entity';

@Entity('Doctors')
export class Doctor extends BaseStaffEntity {
  @Column('bool', { default: false })
  isApproved: boolean;
}
