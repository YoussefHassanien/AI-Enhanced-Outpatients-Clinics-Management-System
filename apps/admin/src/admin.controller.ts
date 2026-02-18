import { AdminPatterns, Gender, PaginationResponse } from '@app/common';
import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import {
  MedicationDosage,
  MedicationPeriod,
  ScanTypes,
} from '../..//doctor/src/constants';
import {
  CreateMedicationInternalDto,
  CreateVisitInternalDto,
  DoctorInternalPaginationRequestDto,
  UploadLabInternalDto,
  UploadScanInternalDto,
} from '../../doctor/src/dtos';
import { AdminService } from './admin.service';
import {
  AdminInternalPaginationRequestDto,
  DoctorResponseDTO,
  PatientResponseDTO,
} from './dtos';

@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @MessagePattern({ cmd: AdminPatterns.IS_UP })
  isUp(): string {
    return this.adminService.isUp();
  }

  @MessagePattern({ cmd: AdminPatterns.GET_PATIENT_BY_GLOBAL_ID })
  async getPatientByGlobalId(
    @Payload() globalId: string,
  ): Promise<PatientResponseDTO> {
    return await this.adminService.getPatientByGlobalId(globalId);
  }

  @MessagePattern({ cmd: AdminPatterns.GET_DOCTOR_BY_GLOBAL_ID })
  async getDoctorByGlobalId(
    @Payload() globalId: string,
  ): Promise<DoctorResponseDTO> {
    return await this.adminService.getDoctorByGlobalId(globalId);
  }

  @MessagePattern({ cmd: AdminPatterns.GET_PATIENT_VISITS })
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
    return await this.adminService.getPatientVisits(patientGlobalId);
  }

  @MessagePattern({ cmd: AdminPatterns.GET_ADMIN_PATIENTS })
  async getAdminPatients(
    @Payload()
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
    return await this.adminService.getAdminPatients(
      doctorInternalPaginationRequestDto,
    );
  }

  @MessagePattern({ cmd: AdminPatterns.GET_ADMIN_VISITS })
  async getAdminVisits(
    @Payload()
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

  @MessagePattern({ cmd: AdminPatterns.GET_PATIENT_MEDICATIONS })
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
    return await this.adminService.getPatientMedications(patientGlobalId);
  }

  @MessagePattern({ cmd: AdminPatterns.GET_PATIENT_SCANS })
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
    return await this.adminService.getPatientScans(patientGlobalId);
  }

  @MessagePattern({ cmd: AdminPatterns.GET_CLINIC_VISITS })
  async getClinicVisits(
    @Payload()
    adminInternalPaginationRequestDto: AdminInternalPaginationRequestDto,
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
    return await this.adminService.getClinicVisits(
      adminInternalPaginationRequestDto,
    );
  }

  @MessagePattern({ cmd: AdminPatterns.GET_CLINIC_DOCTORS })
  async getClinicDoctors(
    @Payload()
    adminInternalPaginationRequestDto: AdminInternalPaginationRequestDto,
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
    return await this.adminService.getClinicDoctors(
      adminInternalPaginationRequestDto,
    );
  }
}
