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
import { IsNull, Not, Repository } from 'typeorm';
import {
  UpdateDoctorInternalDto,
  UpdatePatientInternalDto,
} from '../../auth/src/dtos';
import { Doctor, Patient } from '../../auth/src/entities';
import {
  MedicationDosage,
  MedicationPeriod,
  ScanTypes,
} from '../../doctor/src/constants';
import {
  CreateMedicationInternalDto,
  CreateVisitInternalDto,
  DoctorInternalPaginationRequestDto,
  UpdateLabInternalDto,
  UpdateMedicationInternalDto,
  UpdateScanInternalDto,
  UpdateVisitInternalDto,
  UploadLabInternalDto,
  UploadScanInternalDto,
} from '../../doctor/src/dtos';
import {
  ClinicInternalPaginationRequestDto,
  CreateClinicInternalDto,
  UpdateClinicInternalDto,
} from './dtos';
import { Clinic } from './entities';

@Injectable()
export class SuperAdminService {
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
    return 'Super Admin service is up';
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
      diagnosesAudioUrl: string | null;
      patient: {
        id: string;
        name: string;
      };
      doctor: {
        id: string;
        name: string;
      };
      clinic: {
        id: string;
        name: string;
      };
      createdAt: Date;
    }>
  > {
    return await lastValueFrom<
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
        clinic: {
          id: string;
          name: string;
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

  async updateClinic(
    updateClinicInternalDto: UpdateClinicInternalDto,
  ): Promise<{
    id: string;
    name: string;
    speciality: string;
  }> {
    const clinic = await this.clinicRepository.findOne({
      where: { globalId: updateClinicInternalDto.id, deletedAt: IsNull() },
    });

    if (!clinic) {
      throw new RpcException(new ErrorResponse('Clinic not found!', 404));
    }

    if (updateClinicInternalDto.name) {
      clinic.name = updateClinicInternalDto.name;
    }

    if (updateClinicInternalDto.speciality) {
      clinic.speciality = updateClinicInternalDto.speciality;
    }

    await this.clinicRepository.save(clinic);
    this.logger.log('Successfully updated clinic');

    return {
      id: clinic.globalId,
      name: clinic.name,
      speciality: clinic.speciality,
    };
  }

  async deleteClinic(id: string): Promise<{ message: string }> {
    const clinic = await this.clinicRepository.findOne({
      where: { globalId: id, deletedAt: IsNull() },
    });

    if (!clinic) {
      throw new RpcException(new ErrorResponse('Clinic not found!', 404));
    }

    await this.clinicRepository.softDelete(clinic.id);
    this.logger.log('Successfully deleted clinic');
    return { message: 'Clinic deleted successfully' };
  }

  async restoreClinic(id: string): Promise<{ message: string }> {
    const clinic = await this.clinicRepository.findOne({
      where: { globalId: id },
      withDeleted: true, // Include both active & soft-deleted records (TypeORM excludes soft-deleted records by default)
    });

    if (!clinic) {
      throw new RpcException(new ErrorResponse('Clinic not found!', 404));
    }

    if (!clinic.deletedAt) {
      throw new RpcException(
        new ErrorResponse('Clinic is already active!', 400),
      );
    }

    await this.clinicRepository.restore(clinic.id);
    this.logger.log('Successfully restored clinic');
    return { message: 'Clinic restored successfully' };
  }

  async getAllClinics(paginationRequest: PaginationRequest): Promise<
    PaginationResponse<{ id: string; name: string; speciality: string; createdAt: Date }>
  > {
    const whereCondition: any = {};

    if (paginationRequest.onlyDeleted) {
      whereCondition.deletedAt = Not(IsNull());
    } else if (!paginationRequest.includeDeleted) {
      whereCondition.deletedAt = IsNull();
    }

    const [clinics, count] = await this.clinicRepository.findAndCount({
      select: {
        name: true,
        speciality: true,
        globalId: true,
        createdAt: true,
      },
      where: whereCondition,
      skip: (paginationRequest.page - 1) * paginationRequest.limit,
      take: paginationRequest.limit,
      withDeleted:
        paginationRequest.includeDeleted || paginationRequest.onlyDeleted,
    });

    const response: PaginationResponse<{
      id: string;
      name: string;
      speciality: string;
      createdAt: Date;
    }> = {
      items: clinics.map((clinic) => {
        return {
          id: clinic.globalId,
          name: clinic.name,
          speciality: clinic.speciality,
          createdAt: clinic.createdAt,
        };
      }),
      page: paginationRequest.page,
      totalItems: count,
      totalPages: Math.ceil(count / paginationRequest.limit),
    };

    return response;
  }

  async getAllClinicsWithId(): Promise<
    {
      id: number;
      globalId: string;
      name: string;
      speciality: string;
      createdAt: Date;
    }[]
  > {
    return await this.clinicRepository.find({
      select: {
        id: true,
        name: true,
        speciality: true,
        globalId: true,
        createdAt: true,
      },
      where: {
        deletedAt: IsNull(),
      },
    });
  }

  async getPatientByGlobalId(globalId: string): Promise<{
    id: string;
    address: string | null;
    job: string | null;
    socialSecurityNumber: string;
    gender: Gender;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    createdAt: Date;
  }> {
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
      socialSecurityNumber: String(patient.user.socialSecurityNumber),
      gender: patient.user.gender,
      firstName: patient.user.firstName,
      lastName: patient.user.lastName,
      dateOfBirth: patient.user.dateOfBirth,
      createdAt: patient.createdAt,
    };
  }

  async getDoctorByGlobalId(globalId: string): Promise<{
    id: string;
    phone: string;
    email: string;
    speciality: string;
    isApproved: boolean;
    socialSecurityNumber: string;
    gender: Gender;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    createdAt: Date;
    clinic: {
      id: string;
      name: string;
    };
  }> {
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

    const response = {
      id: doctor.globalId,
      phone: doctor.phone,
      email: doctor.email,
      speciality: doctor.speciality,
      isApproved: doctor.isApproved,
      socialSecurityNumber: String(doctor.user.socialSecurityNumber),
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
    return await lastValueFrom<{ message: string }>(
      this.authClient.send(
        { cmd: AuthPatterns.DOCTOR_UPDATE },
        updateDoctorInternalDto,
      ),
    );
  }

  async deleteDoctor(globalId: string): Promise<{ message: string }> {
    const doctor = await lastValueFrom<Doctor | null>(
      this.authClient.send(
        { cmd: AuthPatterns.GET_DOCTOR_BY_GLOBAL_ID },
        globalId,
      ),
    );

    if (!doctor) {
      throw new RpcException(new ErrorResponse('Doctor not found!', 404));
    }

    return await lastValueFrom<{ message: string }>(
      this.authClient.send({ cmd: AuthPatterns.DOCTOR_DELETE }, globalId),
    );
  }

  async restoreDoctor(globalId: string): Promise<{ message: string }> {
    return await lastValueFrom<{ message: string }>(
      this.authClient.send({ cmd: AuthPatterns.DOCTOR_RESTORE }, globalId),
    );
  }

  async updateVisit(
    updateVisitInternalDto: UpdateVisitInternalDto,
  ): Promise<{ message: string }> {
    return await lastValueFrom<{ message: string }>(
      this.doctorClient.send(
        { cmd: DoctorPatterns.VISIT_UPDATE },
        updateVisitInternalDto,
      ),
    );
  }

  async updateMedication(
    updateMedicationInternalDto: UpdateMedicationInternalDto,
  ): Promise<{ message: string }> {
    return await lastValueFrom<{ message: string }>(
      this.doctorClient.send(
        { cmd: DoctorPatterns.MEDICATION_UPDATE },
        updateMedicationInternalDto,
      ),
    );
  }

  async updateLab(
    updateLabInternalDto: UpdateLabInternalDto,
  ): Promise<{ message: string }> {
    return await lastValueFrom<{ message: string }>(
      this.doctorClient.send(
        { cmd: DoctorPatterns.LAB_UPDATE },
        updateLabInternalDto,
      ),
    );
  }

  async updateScan(
    updateScanInternalDto: UpdateScanInternalDto,
  ): Promise<{ message: string }> {
    return await lastValueFrom<{ message: string }>(
      this.doctorClient.send(
        { cmd: DoctorPatterns.SCAN_UPDATE },
        updateScanInternalDto,
      ),
    );
  }

  async getClinicByGlobalId(clinicGlobalId: string): Promise<Clinic | null> {
    return await this.clinicRepository.findOneBy({
      globalId: clinicGlobalId,
      deletedAt: IsNull(),
    });
  }

  async getClinicById(clinicId: number): Promise<Clinic | null> {
    return await this.clinicRepository.findOneBy({
      id: clinicId,
      deletedAt: IsNull(),
    });
  }

  // ============================================== //
  //     Methods migrated from Admin Controller     //
  // ============================================== //

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

  async getSuperAdminVisits(
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
      superAdmin: {
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
        superAdmin: {
          id: doctor.id,
          name: doctor.name,
        },
      })),
    };
  }

  async getSuperAdminPatients(
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
    return await lastValueFrom(
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

  async getPatientScans(patientGlobalId: string): Promise<{
    patient: {
      id: string;
      name: string;
      gender: Gender;
      dateOfBirth: string;
      socialSecurityNumber: string;
      address: string | null;
      job: string | null;
    };
    scans: {
      name: string;
      type: ScanTypes;
      photoUrl: string;
      comments: string | null;
      commentsAudioUrl: string | null;
      doctor: {
        name: string;
        speciality: string;
      };
      createdAt: string;
    }[];
  }> {
    return await lastValueFrom(
      this.doctorClient.send(
        { cmd: DoctorPatterns.GET_PATIENT_SCANS },
        patientGlobalId,
      ),
    );
  }

  async getPatientLabs(patientGlobalId: string): Promise<{
    patient: {
      id: string;
      name: string;
      gender: Gender;
      dateOfBirth: Date;
      socialSecurityNumber: string;
      address: string | null;
      job: string | null;
    };
    labs: {
      name: string;
      photoUrl: string;
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
        { cmd: DoctorPatterns.GET_PATIENT_LABS },
        patientGlobalId,
      ),
    );
  }

  async getClinicVisits(
    clinicGlobalId: string,
    paginationRequest: PaginationRequest,
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
    const clinic = await this.getClinicByGlobalId(clinicGlobalId);

    if (!clinic) {
      throw new RpcException(new ErrorResponse('Clinic not found!', 404));
    }

    const clinicInternalPaginationRequestDto =
      new ClinicInternalPaginationRequestDto(paginationRequest, clinic.id);

    return lastValueFrom(
      this.doctorClient.send(
        { cmd: DoctorPatterns.GET_CLINIC_VISITS },
        clinicInternalPaginationRequestDto,
      ),
    );
  }

  async getClinicDoctors(
    clinicGlobalId: string,
    paginationRequest: PaginationRequest,
  ): Promise<
    PaginationResponse<{
      id: string;
      phone: string;
      email: string;
      speciality: string;
      isApproved: boolean;
      socialSecurityNumber: string;
      gender: Gender;
      name: string;
      dateOfBirth: Date;
      createdAt: Date;
    }>
  > {
    const clinic = await this.getClinicByGlobalId(clinicGlobalId);

    if (!clinic) {
      throw new RpcException(new ErrorResponse('Clinic not found!', 404));
    }

    const clinicInternalPaginationRequestDto =
      new ClinicInternalPaginationRequestDto(paginationRequest, clinic.id);

    const response = await lastValueFrom<PaginationResponse<Doctor>>(
      this.authClient.send(
        { cmd: AuthPatterns.GET_CLINIC_DOCTORS },
        clinicInternalPaginationRequestDto,
      ),
    );

    return {
      ...response,
      items: response.items.map((doctor) => ({
        id: doctor.globalId,
        name: `${doctor.user.firstName} ${doctor.user.lastName}`,
        speciality: doctor.speciality,
        email: doctor.email,
        phone: doctor.phone,
        isApproved: doctor.isApproved,
        socialSecurityNumber: String(doctor.user.socialSecurityNumber),
        gender: doctor.user.gender,
        dateOfBirth: doctor.user.dateOfBirth,
        createdAt: doctor.createdAt,
      })),
    };
  }

  async getClinicPatients(
    clinicGlobalId: string,
    paginationRequest: PaginationRequest,
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
    const clinic = await this.getClinicByGlobalId(clinicGlobalId);

    if (!clinic) {
      throw new RpcException(new ErrorResponse('Clinic not found!', 404));
    }

    const clinicInternalPaginationRequestDto =
      new ClinicInternalPaginationRequestDto(paginationRequest, clinic.id);

    return lastValueFrom(
      this.doctorClient.send(
        { cmd: DoctorPatterns.GET_CLINIC_PATIENTS },
        clinicInternalPaginationRequestDto,
      ),
    );
  }
}
