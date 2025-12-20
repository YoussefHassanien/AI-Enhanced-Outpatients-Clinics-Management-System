import { BaseEntity } from '@app/common';
import { Column } from 'typeorm';

export abstract class BaseStaffEntity extends BaseEntity {
  @Column('varchar', { length: 15 })
  phone: string;

  @Column('varchar', { length: 256, unique: true })
  email: string;

  @Column('varchar', { length: 256 })
  password: string;

  @Column({ unique: true })
  userId: number;
}
