import { Column, Entity } from 'typeorm';
import { DoctorPatientRelationEntity } from '.';
import { MedicationDosage, MedicationPeriod } from '../constants';

@Entity('Medications')
export class Medication extends DoctorPatientRelationEntity {
  @Column('varchar', { length: 256 })
  name: string;

  @Column('enum', { enum: MedicationDosage })
  dosage: MedicationDosage;

  @Column('enum', { enum: MedicationPeriod })
  period: MedicationPeriod;

  @Column('varchar', { length: 512, nullable: true })
  comments: string;

  @Column('text', { nullable: true })
  commentsAudioUrl: string;
}
