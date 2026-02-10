import {
  AdminPatterns,
  Gender,
  Microservices,
  PaginationRequest,
  PaginationResponse,
} from '@app/common';
import { Inject, BadRequestException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  CreateClinicDto,
  CreateClinicInternalDto,
} from '../../../admin/src/dtos';
import {
  UpdateDoctorDto,
  UpdatePatientDto,
  UpdatePatientInternalDto,
  UpdateDoctorInternalDto,
} from '../../../auth/src/dtos';
import { CreateVisitDto,CreateVisitInternalDto,DoctorInternalPaginationRequestDto } from '../../../doctor/src/dtos';
import { Doctor, Patient } from '../../../auth/src/entities';

export class AdminService {
  constructor(
    @Inject(Microservices.ADMIN) private readonly adminClient: ClientProxy,
  ) { }

  async isUp(): Promise<string> {
    return await lastValueFrom<string>(
      this.adminClient.send({ cmd: AdminPatterns.IS_UP }, {}),
    );
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
      this.adminClient.send(
        { cmd: AdminPatterns.GET_ALL_DOCTORS },
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
      this.adminClient.send(
        { cmd: AdminPatterns.GET_ALL_PATIENTS },
        paginationRequest,
      ),
    );
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
    return await lastValueFrom<
      PaginationResponse<{
        id: string;
        diagnoses: string;
        patientId: string;
        doctorId: string;
        createdAt: Date;
      }>
    >(
      this.adminClient.send(
        { cmd: AdminPatterns.GET_ALL_VISITS },
        paginationRequest,
      ),
    );
  }

  async updatePatient(
    globalId: string,
    updatePatientDto: UpdatePatientDto,
  ): Promise<{ message: string }> {
    const updatePatientInternalDto = new UpdatePatientInternalDto(
      updatePatientDto,
      globalId,
    );

    return await lastValueFrom<{ message: string }>(
      this.adminClient.send(
        { cmd: AdminPatterns.UPDATE_PATIENT },
        updatePatientInternalDto,
      ),
    );
  }

  async createClinic(
    adminUserId: number,
    createClinicDto: CreateClinicDto,
  ): Promise<{
    id: string;
    name: string;
    speciality: string;
  }> {
    const createClinicInternalDto = new CreateClinicInternalDto(
      createClinicDto,
      adminUserId,
    );

    return await lastValueFrom<{
      id: string;
      name: string;
      speciality: string;
    }>(
      this.adminClient.send(
        { cmd: AdminPatterns.CREATE_CLINIC },
        createClinicInternalDto,
      ),
    );
  }

  async getAllClinics(): Promise<
    { id: string; name: string; speciality: string; createdAt: Date }[]
  > {
    return await lastValueFrom<
      { id: string; name: string; speciality: string; createdAt: Date }[]
    >(
      this.adminClient.send(
        { cmd: AdminPatterns.GET_ALL_CLINICS_WITH_GLOBAL_ID },
        {},
      ),
    );
  }

  async getPatientByGlobalId(globalId: string): Promise<Patient | null> {
    return await lastValueFrom<Patient | null>(
      this.adminClient.send(
        { cmd: AdminPatterns.GET_PATIENT_BY_GLOBAL_ID },
        globalId,
      ),
    );
  }

  async getDoctorByGlobalId(globalId: string): Promise<Doctor | null> {
    return await lastValueFrom<Doctor | null>(
      this.adminClient.send(
        { cmd: AdminPatterns.GET_DOCTOR_BY_GLOBAL_ID },
        globalId,
      ),
    );
  }

  async updateDoctor(
    globalId: string,
    updateDoctorDto: UpdateDoctorDto,
  ): Promise<{ message: string }> {
    const updateDoctorInternalDto = new UpdateDoctorInternalDto(
      updateDoctorDto,
      globalId,
    );

    return await lastValueFrom<{ message: string }>(
      this.adminClient.send(
        { cmd: AdminPatterns.UPDATE_DOCTOR },
        updateDoctorInternalDto,
      ),
    );
  }

  private validateAudioFile(audio?: Express.Multer.File) {
    const audioTypeRegExp: RegExp =
      /(audio\/mpeg|audio\/wave|audio\/mp3|audio\/ogg|audio\/wav)$/;
    const audioSize: number = 10 * 1024 * 1024; // 10 MB

    if (audio) {
      console.log('Audio mimetype:', audio.mimetype);
      if (!audioTypeRegExp.test(audio.mimetype)) {
        throw new BadRequestException('Invalid audio file type');
      }

      if (audio.size > audioSize) {
        throw new BadRequestException('Audio file too large');
      }
    }
  }

  async createVisit(
    createVisitDto: CreateVisitDto,
    userId: number,
    audio?: Express.Multer.File,
  ): Promise<void> {
    this.validateAudioFile(audio);

    const createVisitInternalDto = new CreateVisitInternalDto(
      createVisitDto,
      userId,
      audio?.path,
      audio?.mimetype,
    );

    await lastValueFrom<void>(
      this.adminClient.emit(
        { cmd: AdminPatterns.VISIT_CREATE },
        createVisitInternalDto,
      ),
    );
  }

  private validateSocialSecurityNumber(socialSecurityNumber: string): void {
    const regex = /^[23]\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{7}$/;
    if (!regex.test(socialSecurityNumber)) {
      throw new BadRequestException('Invalid social security number format');
    }
  }

  async getPatientVisits(socialSecurityNumber: string): Promise<
    {
      patient: {
        id: string;
        name: string;
        gender: Gender;
        dateOfBirth: Date;
        socialSecurityNumber: string;
        address: string;
        job: string;
      };
      clinic: {
        id: string;
        name: string;
        visits: {
          doctor: {
            name: string;
            speciality: string;
          };
          diagnoses: string;
        }[];
      };
    }[]
  > {
    this.validateSocialSecurityNumber(socialSecurityNumber);
    return await lastValueFrom<
      {
        patient: {
          id: string;
          name: string;
          gender: Gender;
          dateOfBirth: Date;
          socialSecurityNumber: string;
          address: string;
          job: string;
        };
        clinic: {
          id: string;
          name: string;
          visits: {
            doctor: {
              name: string;
              speciality: string;
            };
            diagnoses: string;
          }[];
        };
      }[]
    >(
      this.adminClient.send(
        { cmd: AdminPatterns.GET_PATIENT_VISITS },
        socialSecurityNumber,
      ),
    );
  }

  async getAdminPatients(
    adminUserId: number,
    page: number,
    limit: number,
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
    const paginationRequest: PaginationRequest = { page, limit };

    const doctorInternalPaginationRequestDto =
      new DoctorInternalPaginationRequestDto(paginationRequest, adminUserId);

    return await lastValueFrom(
      this.adminClient.send(
        { cmd: AdminPatterns.GET_ADMIN_PATIENTS },
        doctorInternalPaginationRequestDto,
      ),
    );
  }

  async getAdminVisits(
    adminUserId: number,
    page: number,
    limit: number,
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
    const paginationRequest: PaginationRequest = { page, limit };
  
    const doctorInternalPaginationRequestDto =
      new DoctorInternalPaginationRequestDto(paginationRequest, adminUserId);
  
    return await lastValueFrom(
      this.adminClient.send(
        { cmd: AdminPatterns.GET_ADMIN_VISITS },
        doctorInternalPaginationRequestDto,
      ),
    );
  }
}
