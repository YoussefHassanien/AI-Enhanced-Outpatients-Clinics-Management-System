import {
  AdminPatterns,
  Gender,
  Microservices,
  PaginationRequest,
  PaginationResponse,
} from '@app/common';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  CreateClinicDto,
  CreateClinicInternalDto,
} from '../../../admin/src/dtos';
import {
  UpdatePatientDto,
  UpdatePatientInternalDto,
} from '../../../auth/src/dtos';

export class AdminService {
  constructor(
    @Inject(Microservices.ADMIN) private readonly adminClient: ClientProxy,
  ) {}

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
    >(this.adminClient.send({ cmd: AdminPatterns.GET_ALL_CLINICS }, {}));
  }
}
