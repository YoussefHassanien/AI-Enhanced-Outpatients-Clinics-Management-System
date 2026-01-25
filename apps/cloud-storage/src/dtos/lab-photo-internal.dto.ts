import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class LabPhotoInternalDto {
  @IsUUID()
  labGlobalId: string;

  @IsUUID()
  patientGlobalId: string;

  @IsString()
  @IsNotEmpty()
  imageBase64: string;

  @IsString()
  @IsNotEmpty()
  mimetype: string;

  constructor(
    labGlobalId: string,
    patientGlobalId: string,
    imageBase64: string,
    mimetype: string,
  ) {
    this.labGlobalId = labGlobalId;
    this.patientGlobalId = patientGlobalId;
    this.imageBase64 = imageBase64;
    this.mimetype = mimetype;
  }
}
