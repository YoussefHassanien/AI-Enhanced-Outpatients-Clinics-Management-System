import { Entity } from 'typeorm';
import { BaseStaffEntity } from './base-staff.entity';

@Entity('Admins')
export class Admin extends BaseStaffEntity {}
