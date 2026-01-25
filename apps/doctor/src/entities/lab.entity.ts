import { Column, Entity } from 'typeorm';
import { DoctorPatientRelationEntity } from '.';

@Entity('Labs')
export class Lab extends DoctorPatientRelationEntity {
  @Column('varchar', { length: 256 })
  name: string;

  @Column('text', { nullable: true })
  photoUrl: string;

  @Column('varchar', { length: 512, nullable: true })
  comments: string;
}
