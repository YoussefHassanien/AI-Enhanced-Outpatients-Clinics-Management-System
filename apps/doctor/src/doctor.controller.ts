import {
  DoctorPatterns,
  PaginationRequest,
  PaginationResponse,
} from '@app/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DoctorService } from './doctor.service';
import { CreateMedicationInternalDto, CreateVisitInternalDto } from './dtos';

@Controller()
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @MessagePattern({ cmd: DoctorPatterns.IS_UP })
  isUp(): string {
    return this.doctorService.isUp();
  }

  @MessagePattern({ cmd: DoctorPatterns.VISIT_CREATE })
  async visitCreate(
    @Payload() createVisitInternalDto: CreateVisitInternalDto,
  ): Promise<{ message: string }> {
    await this.doctorService.createVisit(createVisitInternalDto);

    return { message: 'Visit is successfully created' };
  }

  @MessagePattern({ cmd: DoctorPatterns.MEDICATION_CREATE })
  async medicationCreate(
    @Payload() createMedicationInternalDto: CreateMedicationInternalDto,
  ): Promise<{ message: string }> {
    await this.doctorService.createMedication(createMedicationInternalDto);

    return { message: 'Medication is successfully created' };
  }

  @MessagePattern({ cmd: DoctorPatterns.GET_ALL_VISITS })
  async getAllVisits(@Payload() paginationRequest: PaginationRequest): Promise<
    PaginationResponse<{
      id: string;
      diagnoses: string;
      patientId: string;
      doctorId: string;
      createdAt: Date;
    }>
  > {
    return await this.doctorService.getAllVisits(paginationRequest);
  }
}
