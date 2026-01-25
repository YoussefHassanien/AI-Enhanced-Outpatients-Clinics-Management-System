import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { UploadScanDto } from './upload-scan.dto';

export class UploadScanPhotoInternalDto extends UploadScanDto {
  @IsString()
  @IsNotEmpty()
  readonly patientSocialSecurityNumber: string;

  @IsString()
  @IsNotEmpty()
  readonly imageBase64: string;

  @IsString()
  @IsNotEmpty()
  readonly mimetype: string;

  @IsInt()
  readonly doctorUserId: number;

  constructor(
    uploadScanDto: UploadScanDto,
    patientSocialSecurityNumber: string,
    imageBase64: string,
    mimetype: string,
    doctorUserId: number,
  ) {
    super();
    Object.assign(this, uploadScanDto);
    this.patientSocialSecurityNumber = patientSocialSecurityNumber;
    this.imageBase64 = imageBase64;
    this.mimetype = mimetype;
    this.doctorUserId = doctorUserId;
  }
}
