import {
  IsInt,
  IsMimeType,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { UploadLabDto } from './upload-lab.dto';

export class UploadLabInternalDto extends UploadLabDto {
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
    uploadLabDto: UploadLabDto,
    patientSocialSecurityNumber: string,
    doctorUserId: number,
    imageFilePath: string,
    imageMimetype: string,
    audioFilePath?: string,
    audioMimetype?: string,
  ) {
    super();
    Object.assign(this, uploadLabDto);
    this.patientSocialSecurityNumber = patientSocialSecurityNumber;
    this.imageFilePath = imageFilePath;
    this.imageMimetype = imageMimetype;
    this.audioFilePath = audioFilePath;
    this.audioMimetype = audioMimetype;
    this.doctorUserId = doctorUserId;
  }
}
