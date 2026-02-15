import { AdminPatterns, Gender } from '@app/common';
import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateMedicationInternalDto,
  CreateVisitInternalDto,
  DoctorInternalPaginationRequestDto,
  UploadLabInternalDto,
  UploadScanInternalDto,
} from '../../doctor/src/dtos';
import { AdminService } from './admin.service';

@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @MessagePattern({ cmd: AdminPatterns.IS_UP })
  isUp(): string {
    return this.adminService.isUp();
  }

  @MessagePattern({ cmd: AdminPatterns.GET_PATIENT_BY_GLOBAL_ID })
  async getPatientByGlobalId(@Payload() globalId: string) {
    return await this.adminService.getPatientByGlobalId(globalId);
  }

  @MessagePattern({ cmd: AdminPatterns.GET_DOCTOR_BY_GLOBAL_ID })
  async getDoctorByGlobalId(@Payload() globalId: string) {
    return await this.adminService.getDoctorByGlobalId(globalId);
  }

  @MessagePattern({ cmd: AdminPatterns.GET_PATIENT_VISITS })
  async getPatientVisits(@Payload() patientGlobalId: string) {
    return await this.adminService.getPatientVisits(patientGlobalId);
  }

  @MessagePattern({ cmd: AdminPatterns.GET_ADMIN_PATIENTS })
  async getAdminPatients(
    @Payload()
    doctorInternalPaginationRequestDto: DoctorInternalPaginationRequestDto,
  ) {
    return await this.adminService.getAdminPatients(
      doctorInternalPaginationRequestDto,
    );
  }

  @MessagePattern({ cmd: AdminPatterns.GET_ADMIN_VISITS })
  async getAdminVisits(
    @Payload()
    doctorInternalPaginationRequestDto: DoctorInternalPaginationRequestDto,
  ) {
    return await this.adminService.getAdminVisits(
      doctorInternalPaginationRequestDto,
    );
  }

  @EventPattern({ cmd: AdminPatterns.VISIT_CREATE })
  visitCreate(@Payload() createVisitInternalDto: CreateVisitInternalDto): void {
    this.adminService.createVisit(createVisitInternalDto);
  }

  @EventPattern({ cmd: AdminPatterns.MEDICATION_CREATE })
  createMedication(
    @Payload()
    createMedicationInternalDto: CreateMedicationInternalDto,
  ): void {
    this.adminService.createMedication(createMedicationInternalDto);
  }

  @EventPattern({ cmd: AdminPatterns.LAB_UPLOAD })
  uploadLab(@Payload() uploadLabInternalDto: UploadLabInternalDto): void {
    this.adminService.uploadLab(uploadLabInternalDto);
  }

  @EventPattern({ cmd: AdminPatterns.SCAN_UPLOAD })
  uploadScan(@Payload() uploadScanInternalDto: UploadScanInternalDto): void {
    this.adminService.uploadScan(uploadScanInternalDto);
  }

  @MessagePattern({
    cmd: AdminPatterns.SEARCH_FOR_PATIENT_BY_SOCIAL_SECURITY_NUMBER,
  })
  async searchForPatientBySocialSecurityNumber(
    @Payload() socialSecurityNumber: string,
  ): Promise<{
    id: string;
    name: string;
    gender: Gender;
    dateOfBirth: Date;
    socialSecurityNumber: string;
    job: string | null;
    address: string | null;
    createdAt: Date;
  }> {
    return await this.adminService.searchForPatientBySocilaSecurityNumber(
      socialSecurityNumber,
    );
  }
}
