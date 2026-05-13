import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { MedicationDosage, MedicationPeriod } from '../constants';

export class UpdateMedicationDto {
  @ApiPropertyOptional({
    description: 'The medication name',
    example: 'Panadol',
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  name?: string;

  @ApiPropertyOptional({
    description: 'The medication dosage',
    example: MedicationDosage.TWICE_PER_DAY,
    enum: MedicationDosage,
    enumName: 'MedicationDosage',
  })
  @IsOptional()
  @IsEnum(MedicationDosage)
  dosage?: MedicationDosage;

  @ApiPropertyOptional({
    description: 'The medication period',
    example: MedicationPeriod.ONE_WEEK,
    enum: MedicationPeriod,
    enumName: 'MedicationPeriod',
  })
  @IsOptional()
  @IsEnum(MedicationPeriod)
  period?: MedicationPeriod;

  @ApiPropertyOptional({
    description: "The doctor's comments for this medication",
    example: "Can't be taken with an empty stomach",
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  comments?: string;
}
