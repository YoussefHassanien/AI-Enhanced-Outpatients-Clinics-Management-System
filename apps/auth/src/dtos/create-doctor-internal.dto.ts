import { Role } from '@app/common';
import { CreateDoctorDto } from './create-doctor.dto';

export class CreateDoctorInternalDto extends CreateDoctorDto {
  readonly role: Role;
  constructor(createDoctorDto: CreateDoctorDto, role: Role) {
    super();
    Object.assign(this, createDoctorDto);
    this.role = role;
  }
}
