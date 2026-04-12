import {
  Gender,
  Microservices,
  PaginationRequest,
  PaginationResponse,
  SuperAdminPatterns,
} from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  UpdateDoctorDto,
  UpdateDoctorInternalDto,
  UpdatePatientDto,
  UpdatePatientInternalDto,
} from '../../../auth/src/dtos';
import { Doctor, Patient } from '../../../auth/src/entities';
import {
  CreateClinicDto,
  CreateClinicInternalDto,
} from '../../../super-admin/src/dtos';

@Injectable()
export class SuperAdminService {
  constructor(
    @Inject(Microservices.SUPER_ADMIN)
    private readonly superAdminClient: ClientProxy,
  ) {}

  async isUp(): Promise<string> {
    return await lastValueFrom<string>(
      this.superAdminClient.send({ cmd: SuperAdminPatterns.IS_UP }, {}),
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
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.GET_ALL_DOCTORS },
        paginationRequest,
      ),
    );
  }

  async getAllAdmins(paginationRequest: PaginationRequest): Promise<
    PaginationResponse<{
      id: string;
      phone: string;
      email: string;
      speciality: string;
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
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.GET_ALL_ADMINS },
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
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.GET_ALL_PATIENTS },
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
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.GET_ALL_VISITS },
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
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.UPDATE_PATIENT },
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
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.CREATE_CLINIC },
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
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.GET_ALL_CLINICS },
        {},
      ),
    );
  }

  async getPatientByGlobalId(globalId: string): Promise<Patient | null> {
    return await lastValueFrom<Patient | null>(
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.GET_PATIENT_BY_GLOBAL_ID },
        globalId,
      ),
    );
  }

  async getDoctorByGlobalId(globalId: string): Promise<Doctor | null> {
    return await lastValueFrom<Doctor | null>(
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.GET_DOCTOR_BY_GLOBAL_ID },
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
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.UPDATE_DOCTOR },
        updateDoctorInternalDto,
      ),
    );
  }
}
