import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateVisitDto {
  @ApiProperty({
    description: 'The written diagnoses by the doctor for the patient',
    example:
      'Common cold, 3 Days rest, Panadol 500 mg twice per day for 3 days',
  })
  @IsString()
  @IsNotEmpty()
  diagnoses: string;

  @ApiProperty({
    description: 'The patient id of this visit',
    example: '0281ba4f-7592-477e-9d02-f2641aa89221',
  })
  @IsUUID()
  patientId: string;
}
