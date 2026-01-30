import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class MedicationAudioInternalDto {
  @IsUUID()
  readonly medicationGlobalId: string;

  @IsUUID()
  readonly patientGlobalId: string;

  @IsString()
  @IsNotEmpty()
  readonly audioFilePath: string;

  @IsString()
  @IsNotEmpty()
  readonly audioMimetype: string;

  constructor(
    medicationGlobalId: string,
    patientGlobalId: string,
    audioFilePath: string,
    audioMimetype: string,
  ) {
    this.medicationGlobalId = medicationGlobalId;
    this.patientGlobalId = patientGlobalId;
    this.audioFilePath = audioFilePath;
    this.audioMimetype = audioMimetype;
  }
}
