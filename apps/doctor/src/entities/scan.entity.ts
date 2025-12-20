import { Column, Entity } from 'typeorm';
import { DoctorPatientRelationEntity } from '.';
import { ScanTypes } from '../constants';

@Entity('Scans')
export class Scan extends DoctorPatientRelationEntity {
  @Column('varchar', { length: 256 })
  name: string;

  @Column('enum', { enum: ScanTypes })
  type: ScanTypes;

  @Column('text')
  photoUrl: string;

  @Column('varchar', { length: 512, nullable: true })
  comments: string;
}
