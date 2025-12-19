import { Column, Entity } from 'typeorm';
import { DoctorPatientRelation } from '.';

@Entity('Labs')
export class Labs extends DoctorPatientRelation {
  @Column('varchar', { length: 256 })
  name: string;

  @Column('text')
  photoUrl: string;

  @Column('varchar', { length: 512, nullable: true })
  comments: string;
}
