import { PaginationRequest, SuperAdminPatterns } from '@app/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  UpdateDoctorInternalDto,
  UpdatePatientInternalDto,
} from '../../auth/src/dtos';
import { CreateClinicInternalDto } from './dtos';
import { SuperAdminService } from './super-admin.service';

@Controller()
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @MessagePattern({ cmd: SuperAdminPatterns.IS_UP })
  isUp(): string {
    return this.superAdminService.isUp();
  }

  @MessagePattern({ cmd: SuperAdminPatterns.GET_ALL_DOCTORS })
  async getAllDoctors(@Payload() paginationRequest: PaginationRequest) {
    return await this.superAdminService.getAllDoctors(paginationRequest);
  }

  @MessagePattern({ cmd: SuperAdminPatterns.GET_ALL_PATIENTS })
  async getAllPatients(@Payload() paginationRequest: PaginationRequest) {
    return await this.superAdminService.getAllPatients(paginationRequest);
  }

  @MessagePattern({ cmd: SuperAdminPatterns.GET_ALL_VISITS })
  async getAllVisits(@Payload() paginationRequest: PaginationRequest) {
    return await this.superAdminService.getAllVisits(paginationRequest);
  }

  @MessagePattern({ cmd: SuperAdminPatterns.UPDATE_PATIENT })
  async updatePatient(
    @Payload() updatePatientInternalDto: UpdatePatientInternalDto,
  ) {
    return await this.superAdminService.updatePatient(updatePatientInternalDto);
  }

  @MessagePattern({ cmd: SuperAdminPatterns.CREATE_CLINIC })
  async createClinic(
    @Payload() createClinicInternalDto: CreateClinicInternalDto,
  ): Promise<{ id: string; name: string; speciality: string }> {
    return await this.superAdminService.createClinic(createClinicInternalDto);
  }

  @MessagePattern({ cmd: SuperAdminPatterns.GET_ALL_CLINICS })
  async getAllClinics(): Promise<
    { id: string; name: string; speciality: string; createdAt: Date }[]
  > {
    return await this.superAdminService.getAllClinics();
  }

  @MessagePattern({ cmd: SuperAdminPatterns.GET_ALL_CLINICS_WITH_ID })
  async getAllClinicsWithId(): Promise<
    {
      id: number;
      globalId: string;
      name: string;
      speciality: string;
      createdAt: Date;
    }[]
  > {
    return await this.superAdminService.getAllClinicsWithId();
  }

  @MessagePattern({ cmd: SuperAdminPatterns.GET_PATIENT_BY_GLOBAL_ID })
  async getPatientByGlobalId(@Payload() globalId: string) {
    return await this.superAdminService.getPatientByGlobalId(globalId);
  }

  @MessagePattern({ cmd: SuperAdminPatterns.GET_DOCTOR_BY_GLOBAL_ID })
  async getDoctorByGlobalId(@Payload() globalId: string) {
    return await this.superAdminService.getDoctorByGlobalId(globalId);
  }

  @MessagePattern({ cmd: SuperAdminPatterns.UPDATE_DOCTOR })
  async updateDoctor(
    @Payload() updateDoctorInternalDto: UpdateDoctorInternalDto,
  ) {
    return await this.superAdminService.updateDoctor(updateDoctorInternalDto);
  }

  @MessagePattern({ cmd: SuperAdminPatterns.GET_CLINIC_BY_GLOBAL_ID })
  async getClinicByGlobalId(@Payload() clinicGlobalId: string) {
    return await this.superAdminService.getClinicByGlobalId(clinicGlobalId);
  }

  @MessagePattern({ cmd: SuperAdminPatterns.GET_CLINIC_BY_ID })
  async getClinicById(@Payload() clinicId: number) {
    return await this.superAdminService.getClinicById(clinicId);
  }
}
