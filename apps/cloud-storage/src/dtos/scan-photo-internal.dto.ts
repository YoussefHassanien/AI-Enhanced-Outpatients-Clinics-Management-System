import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ScanTypes } from '../../../doctor/src/constants';

export class ScanPhotoInternalDto {
  @IsUUID()
  scanGlobalId: string;

  @IsUUID()
  patientGlobalId: string;

  @IsString()
  @IsNotEmpty()
  imageBase64: string;

  @IsString()
  @IsNotEmpty()
  mimetype: string;

  @IsEnum(ScanTypes)
  type: ScanTypes;

  constructor(
    scanGlobalId: string,
    patientGlobalId: string,
    imageBase64: string,
    mimetype: string,
    type: ScanTypes,
  ) {
    this.scanGlobalId = scanGlobalId;
    this.patientGlobalId = patientGlobalId;
    this.imageBase64 = imageBase64;
    this.mimetype = mimetype;
    this.type = type;
  }
}
