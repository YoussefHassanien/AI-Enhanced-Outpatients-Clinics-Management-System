import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class VisitAudioInternalDto {
  @IsUUID()
  readonly visitGlobalId: string;

  @IsUUID()
  readonly patientGlobalId: string;

  @IsString()
  @IsNotEmpty()
  readonly audioFilePath: string;

  @IsString()
  @IsNotEmpty()
  readonly audioMimetype: string;

  constructor(
    visitGlobalId: string,
    patientGlobalId: string,
    audioFilePath: string,
    audioMimetype: string,
  ) {
    this.visitGlobalId = visitGlobalId;
    this.patientGlobalId = patientGlobalId;
    this.audioFilePath = audioFilePath;
    this.audioMimetype = audioMimetype;
  }
}
