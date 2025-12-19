import { Column, Entity } from 'typeorm';
import { DoctorPatientRelation } from '.';
import { MedicationDosage, MedicationPeriod } from '../constants';

@Entity('Medications')
export class Medications extends DoctorPatientRelation {
  @Column('varchar', { length: 256 })
  name: string;

  @Column('enum', { enum: MedicationDosage })
  dosage: MedicationDosage;

  @Column('enum', { enum: MedicationPeriod })
  period: MedicationPeriod;

  @Column('varchar', { length: 512, nullable: true })
  comments: string;
}
