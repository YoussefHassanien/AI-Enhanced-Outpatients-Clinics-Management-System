import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ScanAudioInternalDto {
  @IsUUID()
  readonly scanGlobalId: string;

  @IsUUID()
  readonly patientGlobalId: string;

  @IsString()
  @IsNotEmpty()
  readonly audioFilePath: string;

  @IsString()
  @IsNotEmpty()
  readonly audioMimetype: string;

  constructor(
    scanGlobalId: string,
    patientGlobalId: string,
    audioFilePath: string,
    audioMimetype: string,
  ) {
    this.scanGlobalId = scanGlobalId;
    this.patientGlobalId = patientGlobalId;
    this.audioFilePath = audioFilePath;
    this.audioMimetype = audioMimetype;
  }
}
