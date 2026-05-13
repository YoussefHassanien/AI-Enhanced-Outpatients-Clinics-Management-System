import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateVisitDto {
  @ApiPropertyOptional({
    description: 'The written diagnoses by the doctor for the patient',
    example:
      'Common cold, 3 Days rest, Panadol 500 mg twice per day for 3 days',
  })
  @IsString()
  @IsOptional()
  diagnoses?: string;
}
