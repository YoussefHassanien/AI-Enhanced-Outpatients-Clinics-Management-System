import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import BaseEntity from '../../../constants/baseEntity';
import { User } from './user.entity';

@Entity('Doctors')
export class Doctor extends BaseEntity {
  @Column('varchar', { length: 512 })
  speciality: string;

  @Column('varchar', { length: 15 })
  phone: string;

  @Column('varchar', { length: 256, unique: true })
  email: string;

  @Column('bool')
  isApproved: boolean;

  @Column({ unique: true })
  userId: number;

  @OneToOne(() => User, (user) => user.doctor)
  @JoinColumn({ name: 'userId' })
  user: User;
}
