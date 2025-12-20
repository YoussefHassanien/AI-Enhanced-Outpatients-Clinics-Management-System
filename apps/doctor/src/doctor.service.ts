import { AuthPatterns, ErrorResponse, Services } from '@app/common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { lastValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { Doctor, Patient } from '../../auth/src/entities';
import { CreateVisitInternalDto } from './dtos';
import { Lab, Medication, Scan, Visit } from './entities';

@Injectable()
export class DoctorService {
  private readonly logger: Logger;
  constructor(
    @InjectRepository(Lab)
    private readonly labsRepository: Repository<Lab>,
    @InjectRepository(Visit)
    private readonly visitsRepository: Repository<Visit>,
    @InjectRepository(Medication)
    private readonly medicationsRepository: Repository<Medication>,
    @InjectRepository(Scan)
    private readonly scansRepository: Repository<Scan>,
    @Inject(Services.AUTH) private readonly authClient: ClientProxy,
  ) {
    this.logger = new Logger(DoctorService.name);
  }

  private async getDoctorByUserId(doctorUserId: number) {
    const doctor = await lastValueFrom<Promise<Doctor | null>>(
      this.authClient.send(
        { cmd: AuthPatterns.GET_DOCTOR_BY_USER_ID },
        doctorUserId,
      ),
    );

    if (!doctor) {
      this.logger.log('Doctor not found');
      return null;
    }

    this.logger.log('Doctor is found');
    return doctor;
  }

  private async getPatientByGlobalId(patientGlobalId: string) {
    const patient = await lastValueFrom<Promise<Patient | null>>(
      this.authClient.send(
        { cmd: AuthPatterns.GET_PATIENT_BY_GLOBAL_ID },
        patientGlobalId,
      ),
    );

    if (!patient) {
      this.logger.log('Patient not found');
      return null;
    }

    this.logger.log('Patient is found');
    return patient;
  }

  isUp(): string {
    return 'Auth service is up';
  }

  async createVisit(
    createVisitInternalDto: CreateVisitInternalDto,
  ): Promise<Visit> {
    const doctor = await this.getDoctorByUserId(
      createVisitInternalDto.doctorUserId,
    );

    if (!doctor) {
      throw new RpcException(new ErrorResponse('Doctor not found!', 404));
    }

    const patient = await this.getPatientByGlobalId(
      createVisitInternalDto.patientId,
    );

    if (!patient) {
      throw new RpcException(new ErrorResponse('Patient not found!', 404));
    }

    const visit = this.visitsRepository.create({
      diagnoses: createVisitInternalDto.diagnoses,
      patientId: patient.id,
      doctorId: doctor.id,
    });
    this.logger.log('Successfully created visit');

    await this.visitsRepository.insert(visit);
    this.logger.log('Successfully inserted visit');

    return visit;
  }
}
