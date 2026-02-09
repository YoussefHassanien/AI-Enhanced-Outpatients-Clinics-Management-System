import { Column, Entity, Index } from 'typeorm';
import { BaseStaffEntity } from './base-staff.entity';

@Entity('Admins')
export class Admin extends BaseStaffEntity {
  @Column('varchar', { length: 512 })
  speciality: string;

  @Column('integer', { nullable: false })
  @Index()
  clinicId: number;
}
