import {
  Gender,
  PaginationRequest,
  PaginationResponse,
  SuperAdminPatterns,
} from '@app/common';
import {
  MedicationDosage,
  MedicationPeriod,
  ScanTypes,
} from '../../doctor/src/constants';
import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import {
  UpdateDoctorInternalDto,
  UpdatePatientInternalDto,
} from '../../auth/src/dtos';
import { CreateClinicInternalDto } from './dtos';
import { SuperAdminService } from './super-admin.service';
import {
  CreateMedicationInternalDto,
  CreateVisitInternalDto,
  DoctorInternalPaginationRequestDto,
  UploadLabInternalDto,
  UploadScanInternalDto,
} from '../../doctor/src/dtos';

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

  // ============================================== //
  //     Methods migrated from Admin Controller     //
  // ============================================== //

  @MessagePattern({ cmd: SuperAdminPatterns.GET_PATIENT_VISITS })
  async getPatientVisits(@Payload() patientGlobalId: string): Promise<{
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
    return await this.superAdminService.getPatientVisits(patientGlobalId);
  }

  @MessagePattern({ cmd: SuperAdminPatterns.GET_SUPER_ADMIN_PATIENTS })
  async getSuperAdminPatients(
    @Payload()
    doctorInternalPaginationRequestDto: DoctorInternalPaginationRequestDto,
  ) : Promise<
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
    return await this.superAdminService.getSuperAdminPatients(
      doctorInternalPaginationRequestDto,
    );
  }

  @MessagePattern({ cmd: SuperAdminPatterns.GET_SUPER_ADMIN_VISITS })
  async getSuperAdminVisits(
    @Payload()
    doctorInternalPaginationRequestDto: DoctorInternalPaginationRequestDto,
  ) : Promise<
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
    return await this.superAdminService.getSuperAdminVisits(
      doctorInternalPaginationRequestDto,
    );
  }

  @EventPattern({ cmd: SuperAdminPatterns.VISIT_CREATE })
  visitCreate(@Payload() createVisitInternalDto: CreateVisitInternalDto): void {
    this.superAdminService.createVisit(createVisitInternalDto);
  }

  @EventPattern({ cmd: SuperAdminPatterns.MEDICATION_CREATE })
  createMedication(
    @Payload()
    createMedicationInternalDto: CreateMedicationInternalDto,
  ): void {
    this.superAdminService.createMedication(createMedicationInternalDto);
  }

  @EventPattern({ cmd: SuperAdminPatterns.LAB_UPLOAD })
  uploadLab(@Payload() uploadLabInternalDto: UploadLabInternalDto): void {
    this.superAdminService.uploadLab(uploadLabInternalDto);
  }

  @EventPattern({ cmd: SuperAdminPatterns.SCAN_UPLOAD })
  uploadScan(@Payload() uploadScanInternalDto: UploadScanInternalDto): void {
    this.superAdminService.uploadScan(uploadScanInternalDto);
  }

  @MessagePattern({
    cmd: SuperAdminPatterns.SEARCH_FOR_PATIENT_BY_SOCIAL_SECURITY_NUMBER,
  })
  async searchForPatientBySocialSecurityNumber(
    @Payload() socialSecurityNumber: string,
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
    return await this.superAdminService.searchForPatientBySocilaSecurityNumber(
      socialSecurityNumber,
    );
  }

  @MessagePattern({ cmd: SuperAdminPatterns.GET_PATIENT_MEDICATIONS })
  async getPatientMedications(@Payload() patientGlobalId: string): Promise<{
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
    return await this.superAdminService.getPatientMedications(patientGlobalId);
  }

  @MessagePattern({ cmd: SuperAdminPatterns.GET_PATIENT_SCANS })
  async getPatientScans(@Payload() patientGlobalId: string): Promise<{
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
    return await this.superAdminService.getPatientScans(patientGlobalId);
  }

  @MessagePattern({ cmd: SuperAdminPatterns.GET_PATIENT_LABS })
  async getPatientLabs(@Payload() patientGlobalId: string): Promise<{
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
    return await this.superAdminService.getPatientLabs(patientGlobalId);
  }

  @MessagePattern({ cmd: SuperAdminPatterns.GET_CLINIC_VISITS })
  async getClinicVisits(
    @Payload()
    data: { clinicGlobalId: string; paginationRequest: PaginationRequest },
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
    return await this.superAdminService.getClinicVisits(
      data.clinicGlobalId,
      data.paginationRequest,
    );
  }

  @MessagePattern({ cmd: SuperAdminPatterns.GET_CLINIC_DOCTORS })
  async getClinicDoctors(
    @Payload()
    data: { clinicGlobalId: string; paginationRequest: PaginationRequest },
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
    return await this.superAdminService.getClinicDoctors(
      data.clinicGlobalId,
      data.paginationRequest,
    );
  }

  @MessagePattern({ cmd: SuperAdminPatterns.GET_CLINIC_PATIENTS })
  async getClinicPatients(
    @Payload()
    data: { clinicGlobalId: string; paginationRequest: PaginationRequest },
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
    return await this.superAdminService.getClinicPatients(
      data.clinicGlobalId,
      data.paginationRequest,
    );
  }
}
