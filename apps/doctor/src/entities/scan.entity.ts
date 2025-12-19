import { Column, Entity } from 'typeorm';
import { DoctorPatientRelation } from '.';
import { ScanTypes } from '../constants';

@Entity('Scans')
export class Scans extends DoctorPatientRelation {
  @Column('varchar', { length: 256 })
  name: string;

  @Column('enum', { enum: ScanTypes })
  type: ScanTypes;

  @Column('text')
  photoUrl: string;

  @Column('varchar', { length: 512, nullable: true })
  comments: string;
}
