import { Column, Entity } from 'typeorm';
import { DoctorPatientRelation } from './doctor-patient-relation.entity';

@Entity('Visits')
export class Visits extends DoctorPatientRelation {
  @Column('text')
  diagnoses: string;
}
