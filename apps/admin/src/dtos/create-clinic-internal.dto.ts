import { IsInt } from 'class-validator';
import { CreateClinicDto } from './create-clinic.dto';

export class CreateClinicInternalDto extends CreateClinicDto {
  @IsInt()
  readonly adminUserId: number;
  constructor(createClinicDto: CreateClinicDto, adminUserId: number) {
    super();
    Object.assign(this, createClinicDto);
    this.adminUserId = adminUserId;
  }
}
