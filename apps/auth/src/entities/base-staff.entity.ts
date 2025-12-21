import { BaseEntity } from '@app/common';
import { Column, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';

export abstract class BaseStaffEntity extends BaseEntity {
  @Column('varchar', { length: 15, unique: true })
  phone: string;

  @Column('varchar', { length: 256, unique: true })
  email: string;

  @Column('varchar', { length: 256 })
  password: string;

  @OneToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn()
  user: User;
}
