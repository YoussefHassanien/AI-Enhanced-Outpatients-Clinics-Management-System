import {
  AuthPatterns,
  CommonServices,
  ErrorResponse,
  LoggingService,
  Microservices,
  PaginationRequest,
  PaginationResponse,
} from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { lastValueFrom } from 'rxjs';
import { IsNull, Repository } from 'typeorm';
import { Doctor, Patient } from '../../auth/src/entities';
import { CreateMedicationInternalDto, CreateVisitInternalDto } from './dtos';
import { Lab, Medication, Scan, Visit } from './entities';

@Injectable()
export class DoctorService {
  private readonly logger: LoggingService;
  constructor(
    @InjectRepository(Lab)
    private readonly labsRepository: Repository<Lab>,
    @InjectRepository(Visit)
    private readonly visitsRepository: Repository<Visit>,
    @InjectRepository(Medication)
    private readonly medicationsRepository: Repository<Medication>,
    @InjectRepository(Scan)
    private readonly scansRepository: Repository<Scan>,
    @Inject(Microservices.AUTH) private readonly authClient: ClientProxy,
    @Inject(CommonServices.LOGGING) logger: LoggingService,
  ) {
    this.logger = logger;
  }

  private async getDoctorByUserId(
    doctorUserId: number,
  ): Promise<Doctor | null> {
    const doctor = await lastValueFrom<Doctor | null>(
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

  private async getPatientByGlobalId(
    patientGlobalId: string,
  ): Promise<Patient | null> {
    const patient = await lastValueFrom<Patient | null>(
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
    return 'Doctor service is up';
  }

  async createVisit(
    createVisitInternalDto: CreateVisitInternalDto,
  ): Promise<void> {
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
  }

  async createMedication(
    createMedicationInternalDto: CreateMedicationInternalDto,
  ): Promise<void> {
    const doctor = await this.getDoctorByUserId(
      createMedicationInternalDto.doctorUserId,
    );

    if (!doctor) {
      throw new RpcException(new ErrorResponse('Doctor not found!', 404));
    }

    const patient = await this.getPatientByGlobalId(
      createMedicationInternalDto.patientId,
    );

    if (!patient) {
      throw new RpcException(new ErrorResponse('Patient not found!', 404));
    }

    const medication = this.medicationsRepository.create({
      name: createMedicationInternalDto.name,
      dosage: createMedicationInternalDto.dosage,
      period: createMedicationInternalDto.period,
      comments: createMedicationInternalDto.comments,
      patientId: patient.id,
      doctorId: doctor.id,
    });
    this.logger.log('Successfully created medication');

    await this.medicationsRepository.insert(medication);
    this.logger.log('Successfully inserted medication');
  }

  async getAllVisits(paginationRequest: PaginationRequest): Promise<
    PaginationResponse<{
      id: string;
      diagnoses: string;
      patientId: string;
      doctorId: string;
      createdAt: Date;
    }>
  > {
    const count = await this.visitsRepository.count({
      where: {
        deletedAt: IsNull(),
      },
    });
    this.logger.log(`Visits count is ${count}`);

    const visits = await this.visitsRepository.find({
      select: {
        globalId: true,
        diagnoses: true,
        patientId: true,
        doctorId: true,
        createdAt: true,
      },
      where: {
        deletedAt: IsNull(),
      },
      skip: (paginationRequest.page - 1) * paginationRequest.limit,
      take: paginationRequest.limit,
    });
    this.logger.log(
      `Successfully retrieved ${paginationRequest.limit} visits from page: ${paginationRequest.page - 1}`,
    );

    // Fetch patient and doctor global IDs via RPC
    const items = await Promise.all(
      visits.map(async (visit) => {
        const [patient, doctor] = await Promise.all([
          lastValueFrom<Patient | null>(
            this.authClient.send(
              { cmd: AuthPatterns.GET_PATIENT_BY_ID },
              visit.patientId,
            ),
          ),
          lastValueFrom<Doctor | null>(
            this.authClient.send(
              { cmd: AuthPatterns.GET_DOCTOR_BY_ID },
              visit.doctorId,
            ),
          ),
        ]);

        return {
          id: visit.globalId,
          diagnoses: visit.diagnoses,
          patientId: patient?.globalId ?? 'UNKNOWN',
          doctorId: doctor?.globalId ?? 'UNKNOWN',
          createdAt: visit.createdAt,
        };
      }),
    );

    const respone: PaginationResponse<{
      id: string;
      diagnoses: string;
      patientId: string;
      doctorId: string;
      createdAt: Date;
    }> = {
      page: paginationRequest.page,
      items,
      totalItems: count,
      totalPages: Math.ceil(count / paginationRequest.limit),
    };

    return respone;
  }
}
