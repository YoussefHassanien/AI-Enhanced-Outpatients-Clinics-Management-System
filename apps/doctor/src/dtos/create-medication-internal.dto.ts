import {
  IsInt,
  IsMimeType,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { CreateMedicationDto } from './create-medication.dto';

export class CreateMedicationInternalDto extends CreateMedicationDto {
  @IsInt()
  @IsPositive()
  readonly doctorUserId: number;

  @IsString()
  @IsOptional()
  readonly audioFilePath?: string;

  @IsMimeType()
  @IsOptional()
  readonly audioMimetype?: string;

  constructor(
    createMedicationDto: CreateMedicationDto,
    doctorUserId: number,
    audioFilePath?: string,
    audioMimetype?: string,
  ) {
    super();
    Object.assign(this, createMedicationDto);
    this.doctorUserId = doctorUserId;
    this.audioFilePath = audioFilePath;
    this.audioMimetype = audioMimetype;
  }
}
