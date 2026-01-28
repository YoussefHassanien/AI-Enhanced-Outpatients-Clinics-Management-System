import {
  IsInt,
  IsMimeType,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { UploadScanDto } from './upload-scan.dto';

export class UploadScanInternalDto extends UploadScanDto {
  @IsString()
  @IsNotEmpty()
  readonly patientSocialSecurityNumber: string;

  @IsString()
  @IsNotEmpty()
  readonly imageFilePath: string;

  @IsMimeType()
  readonly imageMimetype: string;

  @IsString()
  @IsOptional()
  readonly audioFilePath?: string;

  @IsMimeType()
  @IsOptional()
  readonly audioMimetype?: string;

  @IsInt()
  readonly doctorUserId: number;

  constructor(
    uploadScanDto: UploadScanDto,
    patientSocialSecurityNumber: string,
    doctorUserId: number,
    imageFilePath: string,
    imageMimetype: string,
    audioFilePath?: string,
    audioMimetype?: string,
  ) {
    super();
    Object.assign(this, uploadScanDto);
    this.patientSocialSecurityNumber = patientSocialSecurityNumber;
    this.imageFilePath = imageFilePath;
    this.imageMimetype = imageMimetype;
    this.audioFilePath = audioFilePath;
    this.audioMimetype = audioMimetype;
    this.doctorUserId = doctorUserId;
  }
}
