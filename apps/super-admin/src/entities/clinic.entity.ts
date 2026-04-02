import { BaseEntity } from '@app/common';
import { Column, Entity } from 'typeorm';

@Entity('Clinics')
export class Clinic extends BaseEntity {
  @Column('varchar', { length: 256, nullable: false })
  speciality: string;

  @Column('varchar', { length: 256, nullable: false })
  name: string;
}
