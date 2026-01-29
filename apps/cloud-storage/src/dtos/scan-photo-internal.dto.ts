import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ScanPhotoInternalDto {
  @IsUUID()
  readonly scanGlobalId: string;

  @IsUUID()
  readonly patientGlobalId: string;

  @IsString()
  @IsNotEmpty()
  readonly imageFilePath: string;

  @IsString()
  @IsNotEmpty()
  readonly imageMimetype: string;

  constructor(
    scanGlobalId: string,
    patientGlobalId: string,
    imageFilePath: string,
    imageMimetype: string,
  ) {
    this.scanGlobalId = scanGlobalId;
    this.patientGlobalId = patientGlobalId;
    this.imageFilePath = imageFilePath;
    this.imageMimetype = imageMimetype;
  }
}
