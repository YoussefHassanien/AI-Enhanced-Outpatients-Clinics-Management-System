import { IsInt, IsPositive } from 'class-validator';
import { CreateMedicationDto } from './create-medication.dto';

export class CreateMedicationInternalDto extends CreateMedicationDto {
  @IsInt()
  @IsPositive()
  readonly doctorUserId: number;

  constructor(createMedicationDto: CreateMedicationDto, doctorUserId: number) {
    super();
    Object.assign(this, createMedicationDto);
    this.doctorUserId = doctorUserId;
  }
}
