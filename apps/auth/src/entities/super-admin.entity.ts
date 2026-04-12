import { Column, Entity } from 'typeorm';
import { BaseStaffEntity } from './base-staff.entity';

@Entity('Super-Admins')
export class SuperAdmin extends BaseStaffEntity {
  @Column('varchar', { length: 512, nullable: true })
  speciality: string;
}
