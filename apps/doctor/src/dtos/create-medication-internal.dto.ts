import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';
import { CreateMedicationDto } from './create-medication.dto';

export class CreateMedicationInternalDto extends CreateMedicationDto {
  @IsInt()
  @IsPositive()
  readonly doctorUserId: number;

  @IsString()
  @IsNotEmpty()
  readonly audioBase64?: string;

  @IsString()
  @IsNotEmpty()
  readonly audioMimetype?: string;

  constructor(
    createMedicationDto: CreateMedicationDto,
    doctorUserId: number,
    audioBase64?: string,
    audioMimetype?: string,
  ) {
    super();
    Object.assign(this, createMedicationDto);
    this.doctorUserId = doctorUserId;
    this.audioBase64 = audioBase64;
    this.audioMimetype = audioMimetype;
  }
}
