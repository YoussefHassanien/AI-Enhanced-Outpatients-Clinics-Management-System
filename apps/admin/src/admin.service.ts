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
  SuperAdminPatterns,
} from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { Admin, Doctor, Patient } from '../../auth/src/entities';
import {
  ClinicInternalPaginationRequestDto,
  CreateMedicationInternalDto,
  CreateVisitInternalDto,
  DoctorInternalPaginationRequestDto,
  UploadLabInternalDto,
  UploadScanInternalDto,
} from '../../doctor/src/dtos';
import { Clinic } from '../../super-admin/src/entities';
import { DoctorResponseDTO, PatientResponseDTO } from './dtos';
import {
  MedicationDosage,
  MedicationPeriod,
  ScanTypes,
} from '../../doctor/src/constants';

@Injectable()
export class AdminService {
  private readonly logger: LoggingService;

  constructor(
    @Inject(Microservices.AUTH) private readonly authClient: ClientProxy,
    @Inject(Microservices.DOCTOR) private readonly doctorClient: ClientProxy,
    @Inject(Microservices.SUPER_ADMIN)
    private readonly superAdminClient: ClientProxy,
    @Inject(CommonServices.LOGGING) logger: LoggingService,
  ) {
    this.logger = logger;
  }

  private async getAdminByUserId(userId: number): Promise<Admin | null> {
    const admin = await lastValueFrom<Admin | null>(
      this.authClient.send({ cmd: AuthPatterns.GET_ADMIN_BY_USER_ID }, userId),
    );

    if (!admin) {
      this.logger.log(`Admin of user id: ${userId} not found`);
      return null;
    }

    this.logger.log('Admin is found');
    return admin;
  }

  private async getPatientBySocialSecurityNumber(
    socialSecurityNumber: string,
  ): Promise<Patient | null> {
    const patient = await lastValueFrom<Patient | null>(
      this.authClient.send(
        { cmd: AuthPatterns.GET_PATIENT_BY_SOCIAL_SECURITY_NUMBER },
        socialSecurityNumber,
      ),
    );

    if (!patient) {
      this.logger.log(
        `Patient of social security number: ${socialSecurityNumber} not found`,
      );
      return null;
    }

    this.logger.log('Patient is found');
    return patient;
  }

  isUp(): string {
    return 'Admin service is up';
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

    const clinic = await lastValueFrom<Clinic | null>(
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.GET_CLINIC_BY_ID },
        doctor.clinicId,
      ),
    );

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

  async getPatientVisits(patientGlobalId: string): Promise<{
    patient: {
      id: string;
      name: string;
      gender: Gender;
      dateOfBirth: Date;
      socialSecurityNumber: string;
      address: string | null;
      job: string | null;
    };
    clinics: {
      id: string;
      name: string;
      visits: {
        doctor: {
          name: string;
          speciality: string;
        };
        diagnosesAudioUrl: string | null;
        diagnoses: string;
        createdAt: Date;
      }[];
    }[];
  }> {
    return await lastValueFrom(
      this.doctorClient.send(
        { cmd: DoctorPatterns.GET_PATIENT_VISITS },
        patientGlobalId,
      ),
    );
  }

  async getAdminVisits(
    doctorInternalPaginationRequestDto: DoctorInternalPaginationRequestDto,
  ): Promise<
    PaginationResponse<{
      id: string;
      diagnoses: string;
      diagnosesAudioUrl: string | null;
      patient: {
        name: string;
        id: string;
      };
      admin: {
        name: string;
        id: string;
      };
      createdAt: Date;
    }>
  > {
    const response = await lastValueFrom<
      PaginationResponse<{
        id: string;
        diagnoses: string;
        diagnosesAudioUrl: string | null;
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
        { cmd: DoctorPatterns.GET_DOCTOR_VISITS },
        doctorInternalPaginationRequestDto,
      ),
    );

    return {
      ...response,
      items: response.items.map(({ doctor, ...rest }) => ({
        ...rest,
        admin: {
          id: doctor.id,
          name: doctor.name,
        },
      })),
    };
  }

  async getAdminPatients(
    doctorInternalPaginationRequestDto: DoctorInternalPaginationRequestDto,
  ): Promise<
    PaginationResponse<{
      id: string;
      name: string;
      gender: Gender;
      dateOfBirth: Date;
      socialSecurityNumber: string;
      address: string | null;
      job: string | null;
    }>
  > {
    return await lastValueFrom<
      PaginationResponse<{
        id: string;
        name: string;
        gender: Gender;
        dateOfBirth: Date;
        socialSecurityNumber: string;
        address: string | null;
        job: string | null;
      }>
    >(
      this.doctorClient.send(
        { cmd: DoctorPatterns.GET_DOCTOR_PATIENTS },
        doctorInternalPaginationRequestDto,
      ),
    );
  }

  createVisit(createVisitInternalDto: CreateVisitInternalDto): void {
    this.doctorClient.emit(
      { cmd: DoctorPatterns.VISIT_CREATE },
      createVisitInternalDto,
    );
  }

  createMedication(
    createMedicationInternalDto: CreateMedicationInternalDto,
  ): void {
    this.doctorClient.emit(
      { cmd: DoctorPatterns.MEDICATION_CREATE },
      createMedicationInternalDto,
    );
  }

  uploadLab(uploadLabInternalDto: UploadLabInternalDto): void {
    this.doctorClient.emit(
      { cmd: DoctorPatterns.LAB_UPLOAD },
      uploadLabInternalDto,
    );
  }

  uploadScan(uploadScanInternalDto: UploadScanInternalDto): void {
    this.doctorClient.emit(
      { cmd: DoctorPatterns.SCAN_UPLOAD },
      uploadScanInternalDto,
    );
  }

  async searchForPatientBySocilaSecurityNumber(
    socialSecurityNumber: string,
  ): Promise<{
    id: string;
    name: string;
    gender: Gender;
    dateOfBirth: Date;
    socialSecurityNumber: string;
    address: string | null;
    job: string | null;
    createdAt: Date;
  }> {
    const patient =
      await this.getPatientBySocialSecurityNumber(socialSecurityNumber);

    if (!patient) {
      throw new RpcException(new ErrorResponse('Patient not found!', 404));
    }

    return {
      id: patient.globalId,
      name: `${patient.user.firstName} ${patient.user.lastName}`,
      gender: patient.user.gender,
      dateOfBirth: patient.user.dateOfBirth,
      socialSecurityNumber: String(patient.user.socialSecurityNumber),
      job: patient.job,
      address: patient.address,
      createdAt: patient.createdAt,
    };
  }

  async getPatientMedications(patientGlobalId: string): Promise<{
    patient: {
      id: string;
      name: string;
      gender: Gender;
      dateOfBirth: Date;
      socialSecurityNumber: string;
      address: string | null;
      job: string | null;
    };
    medications: {
      name: string;
      dosage: MedicationDosage;
      period: MedicationPeriod;
      comments: string | null;
      commentsAudioUrl: string | null;
      doctor: {
        name: string;
        speciality: string;
      };
      createdAt: Date;
    }[];
  }> {
    return await lastValueFrom(
      this.doctorClient.send(
        { cmd: DoctorPatterns.GET_PATIENT_MEDICATIONS },
        patientGlobalId,
      ),
    );
  }

  async getClinicVisits(
    getClinicVisitsRequest: PaginationRequest & { userId: number },
  ): Promise<
    PaginationResponse<{
      id: string;
      diagnoses: string;
      diagnosesAudioUrl: string | null;
      patient: {
        name: string;
        id: string;
      };
      doctor: {
        name: string;
        speciality: string;
        id: string;
      };
      createdAt: string;
    }>
  > {
    const admin = await this.getAdminByUserId(getClinicVisitsRequest.userId);
    if (!admin) {
      throw new RpcException(
        new ErrorResponse('Admin not found for this user.', 404),
      );
    }

    const clinicInternalPaginationRequestDto =
      new ClinicInternalPaginationRequestDto(
        getClinicVisitsRequest,
        admin.clinicId,
      );

    return lastValueFrom(
      this.doctorClient.send(
        { cmd: DoctorPatterns.GET_CLINIC_VISITS },
        clinicInternalPaginationRequestDto,
      ),
    );
  }
}
