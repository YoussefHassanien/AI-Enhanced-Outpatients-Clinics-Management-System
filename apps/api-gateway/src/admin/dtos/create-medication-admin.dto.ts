import { OmitType } from '@nestjs/swagger';
import { CreateMedicationDto } from '../../../../doctor/src/dtos/create-medication.dto';

export class CreateMedicationAdminDto extends OmitType(CreateMedicationDto, [
    'patientId',
] as const) { }
