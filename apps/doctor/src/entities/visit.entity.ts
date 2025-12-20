import { Column, Entity } from 'typeorm';
import { DoctorPatientRelationEntity } from './doctor-patient-relation.entity';

@Entity('Visits')
export class Visit extends DoctorPatientRelationEntity {
  @Column('text')
  diagnoses: string;
}
