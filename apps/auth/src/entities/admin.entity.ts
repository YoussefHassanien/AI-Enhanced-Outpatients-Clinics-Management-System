import { Entity } from 'typeorm';
import { BaseStaffEntity } from './bass-staff.entity';

@Entity('Admins')
export class Admin extends BaseStaffEntity {}
