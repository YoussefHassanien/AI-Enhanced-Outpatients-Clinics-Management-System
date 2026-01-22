import { IsUUID } from 'class-validator';
import { UpdatePatientDto } from './update-patient.dto';

export class UpdatePatientInternalDto extends UpdatePatientDto {
  @IsUUID()
  readonly globalId: string;
  constructor(updatePatientDto: UpdatePatientDto, globalId: string) {
    super();
    Object.assign(this, updatePatientDto);
    this.globalId = globalId;
  }
}
