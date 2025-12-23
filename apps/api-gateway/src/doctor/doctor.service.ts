import { DoctorPatterns, Microservices } from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  CreateMedicationDto,
  CreateMedicationInternalDto,
  CreateVisitDto,
  CreateVisitInternalDto,
} from '../../../doctor/src/dtos';

@Injectable()
export class DoctorService {
  constructor(
    @Inject(Microservices.DOCTOR) private readonly doctorClient: ClientProxy,
  ) {}

  async isUp(): Promise<string> {
    return await lastValueFrom<string>(
      this.doctorClient.send({ cmd: DoctorPatterns.IS_UP }, {}),
    );
  }

  async createVisit(
    createVisitDto: CreateVisitDto,
    userId: number,
  ): Promise<{ message: string }> {
    const createVisitInternalDto = new CreateVisitInternalDto(
      createVisitDto,
      userId,
    );

    return await lastValueFrom<{ message: string }>(
      this.doctorClient.send(
        { cmd: DoctorPatterns.VISIT_CREATE },
        createVisitInternalDto,
      ),
    );
  }

  async createMedication(
    createMedicationDto: CreateMedicationDto,
    userId: number,
  ): Promise<{ message: string }> {
    const createMedicationInternalDto = new CreateMedicationInternalDto(
      createMedicationDto,
      userId,
    );

    return await lastValueFrom<{ message: string }>(
      this.doctorClient.send(
        { cmd: DoctorPatterns.MEDICATION_CREATE },
        createMedicationInternalDto,
      ),
    );
  }
}
