import { BaseEntity } from '@app/common';
import { Column, Index } from 'typeorm';

export abstract class DoctorPatientRelationEntity extends BaseEntity {
  @Column()
  @Index()
  patientId: number;

  @Column()
  @Index()
  doctorId: number;
}
