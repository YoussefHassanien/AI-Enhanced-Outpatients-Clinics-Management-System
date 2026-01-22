import { AdminPatterns, PaginationRequest } from '@app/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UpdatePatientInternalDto } from '../../auth/src/dtos';
import { AdminService } from './admin.service';
import { CreateClinicInternalDto } from './dtos';
import { Clinic } from './entities';

@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @MessagePattern({ cmd: AdminPatterns.IS_UP })
  isUp(): string {
    return this.adminService.isUp();
  }

  @MessagePattern({ cmd: AdminPatterns.GET_ALL_DOCTORS })
  async getAllDoctors(@Payload() paginationRequest: PaginationRequest) {
    return await this.adminService.getAllDoctors(paginationRequest);
  }

  @MessagePattern({ cmd: AdminPatterns.GET_ALL_PATIENTS })
  async getAllPatients(@Payload() paginationRequest: PaginationRequest) {
    return await this.adminService.getAllPatients(paginationRequest);
  }

  @MessagePattern({ cmd: AdminPatterns.GET_ALL_VISITS })
  async getAllVisits(@Payload() paginationRequest: PaginationRequest) {
    return await this.adminService.getAllVisits(paginationRequest);
  }

  @MessagePattern({ cmd: AdminPatterns.UPDATE_PATIENT })
  async updatePatient(
    @Payload() updatePatientInternalDto: UpdatePatientInternalDto,
  ) {
    return await this.adminService.updatePatient(updatePatientInternalDto);
  }

  @MessagePattern({ cmd: AdminPatterns.CREATE_CLINIC })
  async createClinic(
    @Payload() createClinicInternalDto: CreateClinicInternalDto,
  ): Promise<{ id: string; name: string; speciality: string }> {
    return await this.adminService.createClinic(createClinicInternalDto);
  }

  @MessagePattern({ cmd: AdminPatterns.GET_ALL_CLINICS_WITH_GLOBAL_ID })
  async getAllClinics(): Promise<
    { id: string; name: string; speciality: string; createdAt: Date }[]
  > {
    return await this.adminService.getAllClinicsWithGlobalId();
  }

  @MessagePattern({ cmd: AdminPatterns.GET_CLINIC_BY_GLOBAL_ID })
  async getClinicByGlobalId(
    @Payload() globalId: string,
  ): Promise<Clinic | null> {
    return await this.adminService.getClinicByGlobalId(globalId);
  }

  @MessagePattern({ cmd: AdminPatterns.GET_CLINIC_BY_ID })
  async getClinicById(@Payload() id: number): Promise<Clinic | null> {
    return await this.adminService.getClinicById(id);
  }

  @MessagePattern({ cmd: AdminPatterns.GET_ALL_CLINICS_WITH_ID })
  async getAllClinicsWithId(): Promise<Clinic[]> {
    return await this.adminService.getAllClinicsWithId();
  }
}
