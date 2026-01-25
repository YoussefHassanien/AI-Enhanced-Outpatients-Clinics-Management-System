import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { UploadLabDto } from './upload-lab.dto';

export class UploadLabInternalDto extends UploadLabDto {
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
    uploadLabDto: UploadLabDto,
    patientSocialSecurityNumber: string,
    imageBase64: string,
    mimetype: string,
    doctorUserId: number,
  ) {
    super();
    Object.assign(this, uploadLabDto);
    this.patientSocialSecurityNumber = patientSocialSecurityNumber;
    this.imageBase64 = imageBase64;
    this.mimetype = mimetype;
    this.doctorUserId = doctorUserId;
  }
}
