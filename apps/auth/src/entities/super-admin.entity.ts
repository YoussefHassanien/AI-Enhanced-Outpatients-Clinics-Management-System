import { Entity } from 'typeorm';
import { BaseStaffEntity } from './base-staff.entity';

@Entity('Super-Admins')
export class SuperAdmin extends BaseStaffEntity {}
