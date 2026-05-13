import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLabDto {
  @ApiPropertyOptional({
    description: 'Lab test name',
    example: 'General blood analysis',
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  name?: string;

  @ApiPropertyOptional({
    description: 'Lab test doctor comments',
    example: 'Blood pressure readings is concerning',
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  comments?: string;
}
