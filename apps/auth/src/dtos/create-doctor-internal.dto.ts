import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { CreateDoctorDto } from './create-doctor.dto';

export class CreateDoctorInternalDto extends CreateDoctorDto {
  @ApiProperty({
    description: 'Whether the doctor is approved',
    default: false,
  })
  @IsBoolean()
  isApproved: boolean;
  constructor(createDoctorDto: CreateDoctorDto, isApproved: boolean = false) {
    super();
    Object.assign(this, createDoctorDto);
    this.isApproved = isApproved;
  }
}
