import { IsString } from 'class-validator';
import { UpdateClinicDto } from './update-clinic.dto';

export class UpdateClinicInternalDto extends UpdateClinicDto {
  @IsString()
  readonly id: string;

  constructor(id: string, updateClinicDto: UpdateClinicDto) {
    super();
    Object.assign(this, updateClinicDto);
    this.id = id;
  }
}
