import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ScanTypes } from '../../../doctor/src/constants';

export class ScanPhotoInternalDto {
  @IsUUID()
  readonly scanGlobalId: string;

  @IsUUID()
  readonly patientGlobalId: string;

  @IsEnum(ScanTypes)
  readonly type: ScanTypes;

  @IsString()
  @IsNotEmpty()
  readonly imageFilePath: string;

  @IsString()
  @IsNotEmpty()
  readonly imageMimetype: string;

  constructor(
    scanGlobalId: string,
    patientGlobalId: string,
    type: ScanTypes,
    imageFilePath: string,
    imageMimetype: string,
  ) {
    this.scanGlobalId = scanGlobalId;
    this.patientGlobalId = patientGlobalId;
    this.type = type;
    this.imageFilePath = imageFilePath;
    this.imageMimetype = imageMimetype;
  }
}
