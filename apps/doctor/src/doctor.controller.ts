import {
  DoctorPatterns,
  Gender,
  PaginationRequest,
  PaginationResponse,
} from '@app/common';
import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { MedicationDosage, MedicationPeriod, ScanTypes } from './constants';
import { DoctorService } from './doctor.service';
import {
  CreateMedicationInternalDto,
  CreateVisitInternalDto,
  GetDoctorPatientsDto,
  GetDoctorVisitsDto,
  UploadLabInternalDto,
  UploadScanPhotoInternalDto,
} from './dtos';

@Controller()
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @MessagePattern({ cmd: DoctorPatterns.IS_UP })
  isUp(): string {
    return this.doctorService.isUp();
  }

  @EventPattern({ cmd: DoctorPatterns.VISIT_CREATE })
  async visitCreate(
    @Payload() createVisitInternalDto: CreateVisitInternalDto,
  ): Promise<{ message: string }> {
    return await this.doctorService.createVisit(createVisitInternalDto);
  }

  @EventPattern({ cmd: DoctorPatterns.MEDICATION_CREATE })
  async medicationCreate(
    @Payload() createMedicationInternalDto: CreateMedicationInternalDto,
  ): Promise<{ message: string }> {
    return await this.doctorService.createMedication(
      createMedicationInternalDto,
    );
  }

  @MessagePattern({ cmd: DoctorPatterns.GET_ALL_VISITS })
  async getAllVisits(@Payload() paginationRequest: PaginationRequest): Promise<
    PaginationResponse<{
      id: string;
      diagnoses: string;
      patientId: string;
      doctorId: string;
      createdAt: Date;
    }>
  > {
    return await this.doctorService.getAllVisits(paginationRequest);
  }

  @MessagePattern({ cmd: DoctorPatterns.GET_PATIENT_VISITS })
  async getPatientVisits(@Payload() socialSecurityNumber: string): Promise<{
    patient: {
      id: string;
      name: string;
      gender: Gender;
      dateOfBirth: Date;
      socialSecurityNumber: string;
      address: string;
      job: string;
    };
    clinics: {
      id: string;
      name: string;
      visits: {
        doctor: {
          name: string;
          speciality: string;
        };
        diagnoses: string;
        createdAt: Date;
      }[];
    }[];
  }> {
    return await this.doctorService.getPatientVisits(socialSecurityNumber);
  }

  @MessagePattern({ cmd: DoctorPatterns.GET_PATIENT_MEDICATIONS })
  async getPatientMedications(
    @Payload() socialSecurityNumber: string,
  ): Promise<{
    patient: {
      id: string;
      name: string;
      gender: Gender;
      dateOfBirth: Date;
      socialSecurityNumber: string;
      address: string;
      job: string;
    };
    medications: {
      name: string;
      dosage: MedicationDosage;
      period: MedicationPeriod;
      comments: string;
      doctor: {
        name: string;
        speciality: string;
      };
      createdAt: Date;
    }[];
  }> {
    return await this.doctorService.getPatientMedications(socialSecurityNumber);
  }

  @MessagePattern({ cmd: DoctorPatterns.GET_PATIENT_SCANS })
  async getPatientScans(@Payload() socialSecurityNumber: string): Promise<{
    patient: {
      id: string;
      name: string;
      gender: Gender;
      dateOfBirth: Date;
      socialSecurityNumber: string;
      address: string;
      job: string;
    };
    scans: {
      name: string;
      type: ScanTypes;
      photoUrl: string;
      comments: string;
      doctor: {
        name: string;
        speciality: string;
      };
      createdAt: Date;
    }[];
  }> {
    return await this.doctorService.getPatientScans(socialSecurityNumber);
  }

  @MessagePattern({ cmd: DoctorPatterns.GET_PATIENT_LABS })
  async getPatientLabs(@Payload() socialSecurityNumber: string): Promise<{
    patient: {
      id: string;
      name: string;
      gender: Gender;
      dateOfBirth: Date;
      socialSecurityNumber: string;
      address: string;
      job: string;
    };
    labs: {
      name: string;
      photoUrl: string;
      comments: string;
      doctor: {
        name: string;
        speciality: string;
      };
      createdAt: Date;
    }[];
  }> {
    return await this.doctorService.getPatientLabs(socialSecurityNumber);
  }

  @MessagePattern({ cmd: DoctorPatterns.GET_DOCTOR_PATIENTS })
  async getDoctorPatients(
    @Payload() getDoctorPatientsDto: GetDoctorPatientsDto,
  ): Promise<{
    page: number;
    items: {
      id: string;
      name: string;
      gender: Gender;
      dateOfBirth: Date;
      socialSecurityNumber: string;
      address: string;
      job: string;
    }[];
    totalItems: number;
    totalPages: number;
  }> {
    return await this.doctorService.getDoctorPatients(getDoctorPatientsDto);
  }

  @MessagePattern({ cmd: DoctorPatterns.GET_DOCTOR_VISITS })
  async getDoctorVisits(
    @Payload() getDoctorVisitsDto: GetDoctorVisitsDto,
  ): Promise<{
    page: number;
    items: {
      id: string;
      diagnoses: string;
      patient: {
        name: string;
        id: string;
      };
      doctor: {
        name: string;
        id: string;
      };
      createdAt: Date;
    }[];
    totalItems: number;
    totalPages: number;
  }> {
    return await this.doctorService.getDoctorVisits(getDoctorVisitsDto);
  }

  @EventPattern({ cmd: DoctorPatterns.LAB_UPLOAD })
  async uploadLab(
    @Payload() uploadLabInternalDto: UploadLabInternalDto,
  ): Promise<void> {
    await this.doctorService.uploadLab(uploadLabInternalDto);
  }

  @EventPattern({ cmd: DoctorPatterns.SCAN_UPLOAD })
  async uploadScan(
    @Payload() uploadScanInternalDto: UploadScanPhotoInternalDto,
  ): Promise<void> {
    await this.doctorService.uploadScan(uploadScanInternalDto);
  }

  @MessagePattern({
    cmd: DoctorPatterns.SEARCH_FOR_PATIENT_BY_SOCIAL_SECURITY_NUMBER,
  })
  async searchForPatientBySocialSecurityNumber(
    @Payload() socialSecurityNumber: string,
  ): Promise<{
    id: string;
    name: string;
    gender: Gender;
    dateOfBirth: Date;
    socialSecurityNumber: string;
    job: string;
    address: string;
    createdAt: Date;
  }> {
    return await this.doctorService.searchForPatientBySocilaSecurityNumber(
      socialSecurityNumber,
    );
  }
}
