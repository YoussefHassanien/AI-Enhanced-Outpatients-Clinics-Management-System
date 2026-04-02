import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class LabPhotoInternalDto {
  @IsUUID()
  readonly labGlobalId: string;

  @IsUUID()
  readonly patientGlobalId: string;

  @IsString()
  @IsNotEmpty()
  readonly imageFilePath: string;

  @IsString()
  @IsNotEmpty()
  readonly imageMimetype: string;

  constructor(
    labGlobalId: string,
    patientGlobalId: string,
    imageFilePath: string,
    imageMimetype: string,
  ) {
    this.labGlobalId = labGlobalId;
    this.patientGlobalId = patientGlobalId;
    this.imageFilePath = imageFilePath;
    this.imageMimetype = imageMimetype;
  }
}
