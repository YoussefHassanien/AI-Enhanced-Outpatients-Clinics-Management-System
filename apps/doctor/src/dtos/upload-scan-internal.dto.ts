import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { UploadScanDto } from './upload-scan.dto';

export class UploadScanInternalDto extends UploadScanDto {
  @IsString()
  @IsNotEmpty()
  readonly patientSocialSecurityNumber: string;

  @IsString()
  @IsNotEmpty()
  readonly imageBase64: string;

  @IsString()
  @IsNotEmpty()
  readonly imageMimetype: string;

  @IsString()
  @IsNotEmpty()
  readonly audioBase64?: string;

  @IsString()
  @IsNotEmpty()
  readonly audioMimetype?: string;

  @IsInt()
  readonly doctorUserId: number;

  constructor(
    uploadScanDto: UploadScanDto,
    patientSocialSecurityNumber: string,
    doctorUserId: number,
    imageBase64: string,
    imageMimetype: string,
    audioBase64?: string,
    audioMimetype?: string,
  ) {
    super();
    Object.assign(this, uploadScanDto);
    this.patientSocialSecurityNumber = patientSocialSecurityNumber;
    this.imageBase64 = imageBase64;
    this.imageMimetype = imageMimetype;
    this.audioBase64 = audioBase64;
    this.audioMimetype = audioMimetype;
    this.doctorUserId = doctorUserId;
  }
}
