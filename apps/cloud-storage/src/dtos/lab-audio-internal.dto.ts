import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class LabAudioInternalDto {
  @IsUUID()
  readonly labGlobalId: string;

  @IsUUID()
  readonly patientGlobalId: string;

  @IsString()
  @IsNotEmpty()
  readonly audioFilePath: string;

  @IsString()
  @IsNotEmpty()
  readonly audioMimetype: string;

  constructor(
    labGlobalId: string,
    patientGlobalId: string,
    audioFilePath: string,
    audioMimetype: string,
  ) {
    this.labGlobalId = labGlobalId;
    this.patientGlobalId = patientGlobalId;
    this.audioFilePath = audioFilePath;
    this.audioMimetype = audioMimetype;
  }
}
