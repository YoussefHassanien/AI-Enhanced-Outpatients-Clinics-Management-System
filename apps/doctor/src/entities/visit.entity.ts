import { Column, Entity, Index } from 'typeorm';
import { DoctorPatientRelationEntity } from './doctor-patient-relation.entity';

@Entity('Visits')
export class Visit extends DoctorPatientRelationEntity {
  @Column('text')
  diagnoses: string;

  @Column('text', { nullable: true })
  diagnosesAudioUrl: string | null;

  @Column('integer', { nullable: false })
  @Index()
  clinicId: number;
}
