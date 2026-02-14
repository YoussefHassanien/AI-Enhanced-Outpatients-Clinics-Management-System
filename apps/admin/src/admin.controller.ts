import { AdminPatterns, CommonServices, LoggingService, PaginationRequest } from '@app/common';
import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload, EventPattern } from '@nestjs/microservices';
import { UpdatePatientInternalDto, UpdateDoctorInternalDto } from '../../auth/src/dtos';
import { AdminService } from './admin.service';
import { CreateClinicInternalDto, CreateMedicationAdminInternalDto, UploadLabAdminInternalDto, UploadScanAdminInternalDto } from './dtos';
import { Clinic } from './entities';
import { CreateVisitInternalDto, DoctorInternalPaginationRequestDto } from '../../doctor/src/dtos';

@Controller()
export class AdminController {
  private readonly logger: LoggingService;

  constructor(
    private readonly adminService: AdminService,
    @Inject(CommonServices.LOGGING) logger: LoggingService,
  ) {
    this.logger = logger;
  }

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

  @MessagePattern({ cmd: AdminPatterns.GET_PATIENT_BY_GLOBAL_ID })
  async getPatientByGlobalId(@Payload() globalId: string) {
    return await this.adminService.getPatientByGlobalId(globalId);
  }

  @MessagePattern({ cmd: AdminPatterns.GET_DOCTOR_BY_GLOBAL_ID })
  async getDoctorByGlobalId(@Payload() globalId: string) {
    return await this.adminService.getDoctorByGlobalId(globalId);
  }

  @MessagePattern({ cmd: AdminPatterns.UPDATE_DOCTOR })
  async updateDoctor(
    @Payload() updateDoctorInternalDto: UpdateDoctorInternalDto,
  ) {
    return await this.adminService.updateDoctor(updateDoctorInternalDto);
  }

  @EventPattern({ cmd: AdminPatterns.VISIT_CREATE })
  async visitCreate(
    @Payload() createVisitInternalDto: CreateVisitInternalDto,
  ): Promise<void> {
    await this.adminService.createVisit(createVisitInternalDto);
  }

  @MessagePattern({ cmd: AdminPatterns.GET_PATIENT_VISITS })
  async getPatientVisits(@Payload() socialSecurityNumber: string) {
    return await this.adminService.getPatientVisits(socialSecurityNumber);
  }

  @MessagePattern({ cmd: AdminPatterns.GET_ADMIN_PATIENTS })
  async getAdminPatients(@Payload() doctorInternalPaginationRequestDto: DoctorInternalPaginationRequestDto) {
    return await this.adminService.getAdminPatients(doctorInternalPaginationRequestDto);
  }

  @MessagePattern({ cmd: AdminPatterns.GET_ADMIN_VISITS })
  async getAdminVisits(@Payload() doctorInternalPaginationRequestDto: DoctorInternalPaginationRequestDto) {
    return await this.adminService.getAdminVisits(doctorInternalPaginationRequestDto);
  }

  @EventPattern({ cmd: AdminPatterns.MEDICATION_CREATE })
  async createMedication(
    @Payload() createMedicationAdminInternalDto: CreateMedicationAdminInternalDto,
  ): Promise<void> {
    await this.adminService.createMedication(createMedicationAdminInternalDto);
  }

  @EventPattern({ cmd: AdminPatterns.LAB_UPLOAD })
  async uploadLab(
    @Payload() uploadLabAdminInternalDto: UploadLabAdminInternalDto,
  ): Promise<void> {
    await this.adminService.uploadLab(uploadLabAdminInternalDto);
  }

  @EventPattern({ cmd: AdminPatterns.SCAN_UPLOAD })
  async uploadScan(
    @Payload() uploadScanAdminInternalDto: UploadScanAdminInternalDto,
  ): Promise<void> {
    await this.adminService.uploadScan(uploadScanAdminInternalDto);
  }
}
