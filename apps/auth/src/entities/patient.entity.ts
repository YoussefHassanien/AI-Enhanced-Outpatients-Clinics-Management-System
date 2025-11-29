import { BaseEntity } from '@app/common';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from '.';

@Entity('Patients')
export class Patient extends BaseEntity {
  @Column('varchar', { length: 512, nullable: true })
  address: string;

  @Column('varchar', { length: 128, nullable: true })
  job: string;

  @Column({ unique: true })
  userId: number;

  @OneToOne(() => User, (user) => user.patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
