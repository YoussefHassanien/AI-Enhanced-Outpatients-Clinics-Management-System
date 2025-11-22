import { Column, Entity } from 'typeorm';
import BaseEntity from '../../../constants/baseEntity';
import { Gender, Role } from '../../../constants/enums';

@Entity('Users')
export class User extends BaseEntity {
  @Column('varchar', { length: 128 })
  firstName: string;

  @Column('varchar', { length: 128 })
  lastName: string;

  @Column('varchar', { length: 256 })
  password: string;

  @Column({ type: 'enum', enum: Role })
  role: Role;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @Column({ type: 'date' })
  dateOfBirth: Date;

  @Column('bigint', { unique: true })
  socialSecurityNumber: bigint;
}
