import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import BaseEntity from '../../../constants/baseEntity';
import { User } from './user.entity';

@Entity('Patients')
export class Patient extends BaseEntity {
  @Column('varchar', { length: 512, nullable: true })
  address: string;

  @Column('varchar', { length: 128, nullable: true })
  job: string;

  @Column({ unique: true })
  userId: number;

  @OneToOne(() => User, (user) => user.patient)
  @JoinColumn({ name: 'userId' })
  user: User;
}
