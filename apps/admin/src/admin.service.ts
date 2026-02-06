import {
  AuthPatterns,
  CommonServices,
  DoctorPatterns,
  ErrorResponse,
  Gender,
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
import { UpdatePatientInternalDto, UpdateDoctorInternalDto } from '../../auth/src/dtos';
import { Admin, Doctor, Patient } from '../../auth/src/entities';
import {
  CreateClinicInternalDto,
  DoctorResponseDTO,
  PatientResponseDTO,
} from './dtos';
import { Clinic } from './entities';

@Injectable()
export class AdminService {
  private readonly logger: LoggingService;

  constructor(
    @Inject(Microservices.AUTH) private readonly authClient: ClientProxy,
    @Inject(Microservices.DOCTOR) private readonly doctorClient: ClientProxy,
    @InjectRepository(Clinic)
    private readonly clinicRepository: Repository<Clinic>,
    @Inject(CommonServices.LOGGING) logger: LoggingService,
  ) {
    this.logger = logger;
  }

  isUp(): string {
    return 'Admin service is up';
  }

  async getAllDoctors(paginationRequest: PaginationRequest): Promise<
    PaginationResponse<{
      id: string;
      phone: string;
      email: string;
      speciality: string;
      isApproved: boolean;
      user: {
        id: string;
        socialSecurityNumber: bigint;
        gender: Gender;
        firstName: string;
        lastName: string;
        dateOfBirth: Date;
      };
    }>
  > {
    if (paginationRequest.limit <= 0 || paginationRequest.page <= 0) {
      throw new RpcException(
        new ErrorResponse('Page and limit must be positive integers', 400),
      );
    }

    return await lastValueFrom<
      PaginationResponse<{
        id: string;
        phone: string;
        email: string;
        speciality: string;
        isApproved: boolean;
        user: {
          id: string;
          socialSecurityNumber: bigint;
          gender: Gender;
          firstName: string;
          lastName: string;
          dateOfBirth: Date;
        };
      }>
    >(
      this.authClient.send(
        { cmd: AuthPatterns.GET_ALL_DOCTORS },
        paginationRequest,
      ),
    );
  }

  async getAllPatients(paginationRequest: PaginationRequest): Promise<
    PaginationResponse<{
      id: string;
      address: string;
      job: string;
      user: {
        id: string;
        socialSecurityNumber: bigint;
        gender: Gender;
        firstName: string;
        lastName: string;
        dateOfBirth: Date;
      };
    }>
  > {
    if (paginationRequest.limit <= 0 || paginationRequest.page <= 0) {
      throw new RpcException(
        new ErrorResponse('Page and limit must be positive integers', 400),
      );
    }

    return await lastValueFrom<
      PaginationResponse<{
        id: string;
        address: string;
        job: string;
        user: {
          id: string;
          socialSecurityNumber: bigint;
          gender: Gender;
          firstName: string;
          lastName: string;
          dateOfBirth: Date;
        };
      }>
    >(
      this.authClient.send(
        { cmd: AuthPatterns.GET_ALL_PATIENTS },
        paginationRequest,
      ),
    );
  }

  async getAllVisits(paginationRequest: PaginationRequest): Promise<
    PaginationResponse<{
      id: string;
      diagnoses: string;
      patient: {
        name: string;
        id: string;
      };
      doctor: {
        name: string;
        id: string;
      };
      createdAt: Date;
    }>
  > {
    if (paginationRequest.limit <= 0 || paginationRequest.page <= 0) {
      throw new RpcException(
        new ErrorResponse('Page and limit must be positive integers', 400),
      );
    }

    return await lastValueFrom<
      PaginationResponse<{
        id: string;
        diagnoses: string;
        patient: {
          name: string;
          id: string;
        };
        doctor: {
          name: string;
          id: string;
        };
        createdAt: Date;
      }>
    >(
      this.doctorClient.send(
        { cmd: DoctorPatterns.GET_ALL_VISITS },
        paginationRequest,
      ),
    );
  }

  async updatePatient(
    updatePatientInternalDto: UpdatePatientInternalDto,
  ): Promise<{ message: string }> {
    const patient = await lastValueFrom<Patient | null>(
      this.authClient.send(
        { cmd: AuthPatterns.GET_PATIENT_BY_GLOBAL_ID },
        updatePatientInternalDto.globalId,
      ),
    );

    if (!patient) {
      throw new RpcException(new ErrorResponse('Patient not found!', 404));
    }

    return await lastValueFrom<{ message: string }>(
      this.authClient.send(
        { cmd: AuthPatterns.PATIENT_UPDATE },
        updatePatientInternalDto,
      ),
    );
  }

  async createClinic(
    createClinicInternalDto: CreateClinicInternalDto,
  ): Promise<{
    id: string;
    name: string;
    speciality: string;
  }> {
    const admin = await lastValueFrom<Admin | null>(
      this.authClient.send(
        { cmd: AuthPatterns.GET_ADMIN_BY_USER_ID },
        createClinicInternalDto.adminUserId,
      ),
    );

    if (!admin) {
      throw new RpcException(new ErrorResponse('Admin not found!', 401));
    }

    const clinic = this.clinicRepository.create({
      name: createClinicInternalDto.name,
      speciality: createClinicInternalDto.speciality,
    });
    this.logger.log('Successfully created clinic');

    await this.clinicRepository.insert(clinic);
    this.logger.log('Successfully inserted clinic');

    return {
      id: clinic.globalId,
      name: clinic.name,
      speciality: clinic.speciality,
    };
  }

  async getAllClinicsWithGlobalId(): Promise<
    { id: string; name: string; speciality: string; createdAt: Date }[]
  > {
    const clinics = await this.clinicRepository.find({
      select: {
        name: true,
        speciality: true,
        globalId: true,
        createdAt: true,
      },
      where: {
        deletedAt: IsNull(),
      },
    });

    return clinics.map((clinic) => {
      return {
        id: clinic.globalId,
        name: clinic.name,
        speciality: clinic.speciality,
        createdAt: clinic.createdAt,
      };
    });
  }

  async getClinicByGlobalId(globalId: string): Promise<Clinic | null> {
    return await this.clinicRepository.findOneBy({
      globalId,
      deletedAt: IsNull(),
    });
  }

  async getClinicById(id: number): Promise<Clinic | null> {
    return await this.clinicRepository.findOneBy({
      id,
      deletedAt: IsNull(),
    });
  }

  async getAllClinicsWithId(): Promise<Clinic[]> {
    return await this.clinicRepository.find({
      select: {
        name: true,
        speciality: true,
        id: true,
      },
      where: {
        deletedAt: IsNull(),
      },
    });
  }

  async getPatientByGlobalId(globalId: string): Promise<PatientResponseDTO> {
    const patient = await lastValueFrom<Patient | null>(
      this.authClient.send(
        { cmd: AuthPatterns.GET_PATIENT_BY_GLOBAL_ID },
        globalId,
      ),
    );

    if (!patient) {
      throw new RpcException(new ErrorResponse('Patient not found', 404));
    }

    return {
      id: patient.globalId,
      address: patient.address,
      job: patient.job,
      socialSecurityNumber: patient.user.socialSecurityNumber,
      gender: patient.user.gender,
      firstName: patient.user.firstName,
      lastName: patient.user.lastName,
      dateOfBirth: patient.user.dateOfBirth,
      createdAt: patient.createdAt,
    };
  }

  async getDoctorByGlobalId(globalId: string): Promise<DoctorResponseDTO> {
    const doctor = await lastValueFrom<Doctor | null>(
      this.authClient.send(
        { cmd: AuthPatterns.GET_DOCTOR_BY_GLOBAL_ID },
        globalId,
      ),
    );

    if (!doctor) {
      throw new RpcException(new ErrorResponse('Doctor not found', 404));
    }

    const clinic = await this.clinicRepository.findOne({
      where: {
        id: doctor.clinicId,
      },
      select: {
        globalId: true,
        name: true,
      },
    });

    if (!clinic) {
      throw new RpcException(new ErrorResponse('Clinic not found', 404));
    }

    const response: DoctorResponseDTO = {
      id: doctor.globalId,
      phone: doctor.phone,
      email: doctor.email,
      speciality: doctor.speciality,
      isApproved: doctor.isApproved,
      socialSecurityNumber: doctor.user.socialSecurityNumber,
      gender: doctor.user.gender,
      firstName: doctor.user.firstName,
      lastName: doctor.user.lastName,
      dateOfBirth: doctor.user.dateOfBirth,
      createdAt: doctor.createdAt,
      clinic: {
        id: clinic.globalId,
        name: clinic.name,
      },
    };

    return response;
  }

  async updateDoctor(
    updateDoctorInternalDto: UpdateDoctorInternalDto,
  ): Promise<{ message: string }> {
    const doctor = await lastValueFrom<Doctor | null>(
      this.authClient.send(
        { cmd: AuthPatterns.GET_DOCTOR_BY_GLOBAL_ID },
        updateDoctorInternalDto.globalId,
      ),
    );

    if (!doctor) {
      throw new RpcException(new ErrorResponse('Doctor not found!', 404));
    }

    return await lastValueFrom<{ message: string }>(
      this.authClient.send(
        { cmd: AuthPatterns.DOCTOR_UPDATE },
        updateDoctorInternalDto,
      ),
    );
  }

}
