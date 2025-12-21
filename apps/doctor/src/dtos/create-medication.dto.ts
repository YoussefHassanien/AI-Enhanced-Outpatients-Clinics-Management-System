import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { MedicationDosage, MedicationPeriod } from '../constants';

export class CreateMedicationDto {
  @ApiProperty({
    description: 'The medication name',
    example: 'Panadol',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  name: string;

  @ApiProperty({
    description: 'The medication dosage',
    example: MedicationDosage.TWICE_PER_DAY,
    enum: MedicationDosage,
    enumName: 'MedicationDosage',
  })
  @IsEnum(MedicationDosage)
  dosage: MedicationDosage;

  @ApiProperty({
    description: 'The medication period',
    example: MedicationPeriod.ONE_WEEK,
    enum: MedicationPeriod,
    enumName: 'MedicationPeriod',
  })
  @IsEnum(MedicationPeriod)
  period: MedicationPeriod;

  @ApiProperty({
    description: "The doctor's comments for this medication",
    example: "Can't be taken with an empty stomach",
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  comments: string;

  @ApiProperty({
    description: 'The patient id of this medication',
    example: '0281ba4f-7592-477e-9d02-f2641aa89221',
  })
  @IsUUID()
  patientId: string;
}
