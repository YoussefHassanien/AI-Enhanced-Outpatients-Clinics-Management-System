import { BaseEntity, Gender, Language, Role } from '@app/common';
import { Column, Entity } from 'typeorm';

@Entity('Users')
export class User extends BaseEntity {
  @Column('varchar', { length: 128 })
  firstName: string;

  @Column('varchar', { length: 128 })
  lastName: string;

  @Column({ type: 'enum', enum: Role })
  role: Role;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @Column({ type: 'enum', enum: Language, default: Language.ENGLISH })
  language: Language;

  @Column({ type: 'date' })
  dateOfBirth: Date;

  @Column('bigint', { unique: true })
  socialSecurityNumber: bigint;
}
