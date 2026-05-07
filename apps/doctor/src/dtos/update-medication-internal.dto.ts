import { IsOptional, IsString, IsUUID } from 'class-validator';
import { UpdateMedicationDto } from './update-medication.dto';

export class UpdateMedicationInternalDto extends UpdateMedicationDto {
  @IsUUID()
  readonly id: string;

  @IsString()
  @IsOptional()
  audioFilePath?: string;

  @IsString()
  @IsOptional()
  audioMimetype?: string;

  constructor(
    id: string,
    updateMedicationDto: UpdateMedicationDto,
    audioFilePath?: string,
    audioMimetype?: string,
  ) {
    super();
    Object.assign(this, updateMedicationDto);
    this.id = id;
    this.audioFilePath = audioFilePath;
    this.audioMimetype = audioMimetype;
  }
}
