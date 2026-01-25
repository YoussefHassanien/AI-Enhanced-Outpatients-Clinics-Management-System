import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadLabDto {
  @ApiProperty({
    description: 'Lab test name',
    example: 'General blood analysis',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  name: string;

  @ApiProperty({
    description: 'Lab test doctor comments',
    example: 'Blood pressure readings is concerning',
  })
  @IsString()
  @MaxLength(512)
  @IsOptional()
  comments: string;
}
