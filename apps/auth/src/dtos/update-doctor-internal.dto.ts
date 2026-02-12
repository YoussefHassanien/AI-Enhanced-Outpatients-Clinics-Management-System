import { IsUUID } from 'class-validator';
import { UpdateDoctorDto } from './update-doctor.dto';

export class UpdateDoctorInternalDto extends UpdateDoctorDto {
  @IsUUID()
  readonly globalId: string;
  constructor(updateDoctorDto: UpdateDoctorDto, globalId: string) {
    super();
    Object.assign(this, updateDoctorDto);
    this.globalId = globalId;
  }
}
