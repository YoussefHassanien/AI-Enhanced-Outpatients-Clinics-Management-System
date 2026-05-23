import {
  Gender,
  Microservices,
  PaginationRequest,
  PaginationResponse,
  SuperAdminPatterns,
} from '@app/common';
import {
  MedicationDosage,
  MedicationPeriod,
  ScanTypes,
} from '../../../doctor/src/constants';
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
  UpdateClinicDto,
  UpdateClinicInternalDto,
} from '../../../super-admin/src/dtos';
import {
  CreateMedicationDto,
  CreateMedicationInternalDto,
  CreateVisitDto,
  CreateVisitInternalDto,
  DoctorInternalPaginationRequestDto,
  UploadLabDto,
  UploadLabInternalDto,
  UploadScanDto,
  UploadScanInternalDto,
  UpdateLabDto,
  UpdateLabInternalDto,
  UpdateMedicationDto,
  UpdateMedicationInternalDto,
  UpdateScanDto,
  UpdateScanInternalDto,
  UpdateVisitDto,
  UpdateVisitInternalDto,
} from '../../../doctor/src/dtos';

@Injectable()
export class SuperAdminService {
  constructor(
    @Inject(Microservices.SUPER_ADMIN)
    private readonly superAdminClient: ClientProxy,
  ) { }

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
      diagnosesAudioUrl: string | null;
      patient: {
        id: string;
        name: string;
      };
      doctor: {
        id: string;
        name: string;
      };
      clinic: {
        id: string;
        name: string;
      };
      createdAt: Date;
    }>
  > {
    return await lastValueFrom<
      PaginationResponse<{
        id: string;
        diagnoses: string;
        diagnosesAudioUrl: string | null;
        patient: {
          id: string;
          name: string;
        };
        doctor: {
          id: string;
          name: string;
        };
        clinic: {
          id: string;
          name: string;
        };
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

  async updateClinic(
    id: string,
    updateClinicDto: UpdateClinicDto,
  ): Promise<{ id: string; name: string; speciality: string }> {
    const updateClinicInternalDto = new UpdateClinicInternalDto(
      id,
      updateClinicDto,
    );
    return await lastValueFrom<{
      id: string;
      name: string;
      speciality: string;
    }>(
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.UPDATE_CLINIC },
        updateClinicInternalDto,
      ),
    );
  }

  async deleteClinic(id: string): Promise<{ message: string }> {
    return await lastValueFrom<{ message: string }>(
      this.superAdminClient.send({ cmd: SuperAdminPatterns.DELETE_CLINIC }, id),
    );
  }

  async restoreClinic(id: string): Promise<{ message: string }> {
    return await lastValueFrom<{ message: string }>(
      this.superAdminClient.send({ cmd: SuperAdminPatterns.RESTORE_CLINIC }, id),
    );
  }

  async getAllClinics(
    paginationRequest: PaginationRequest,
  ): Promise<
    PaginationResponse<{
      id: string;
      name: string;
      speciality: string;
      createdAt: Date;
    }>
  > {
    return await lastValueFrom<
      PaginationResponse<{
        id: string;
        name: string;
        speciality: string;
        createdAt: Date;
      }>
    >(
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.GET_ALL_CLINICS },
        paginationRequest,
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

  async deleteDoctor(globalId: string): Promise<{ message: string }> {
    return await lastValueFrom<{ message: string }>(
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.DELETE_DOCTOR },
        globalId,
      ),
    );
  }

  async restoreDoctor(globalId: string): Promise<{ message: string }> {
    return await lastValueFrom<{ message: string }>(
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.RESTORE_DOCTOR },
        globalId,
      ),
    );
  }

  async updateVisit(
    id: string,
    updateVisitDto: UpdateVisitDto,
    audio?: Express.Multer.File,
  ): Promise<{ message: string }> {
    const updateVisitInternalDto = new UpdateVisitInternalDto(
      id,
      updateVisitDto,
      audio?.path,
      audio?.mimetype,
    );
    return await lastValueFrom<{ message: string }>(
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.VISIT_UPDATE },
        updateVisitInternalDto,
      ),
    );
  }

  async updateMedication(
    id: string,
    updateMedicationDto: UpdateMedicationDto,
    audio?: Express.Multer.File,
  ): Promise<{ message: string }> {
    const updateMedicationInternalDto = new UpdateMedicationInternalDto(
      id,
      updateMedicationDto,
      audio?.path,
      audio?.mimetype,
    );
    return await lastValueFrom<{ message: string }>(
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.MEDICATION_UPDATE },
        updateMedicationInternalDto,
      ),
    );
  }

  async updateLab(
    id: string,
    updateLabDto: UpdateLabDto,
    image?: Express.Multer.File,
    audio?: Express.Multer.File,
  ): Promise<{ message: string }> {
    const updateLabInternalDto = new UpdateLabInternalDto(
      id,
      updateLabDto,
      image?.path,
      image?.mimetype,
      audio?.path,
      audio?.mimetype,
    );
    return await lastValueFrom<{ message: string }>(
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.LAB_UPDATE },
        updateLabInternalDto,
      ),
    );
  }

  async updateScan(
    id: string,
    updateScanDto: UpdateScanDto,
    image?: Express.Multer.File,
    audio?: Express.Multer.File,
  ): Promise<{ message: string }> {
    const updateScanInternalDto = new UpdateScanInternalDto(
      id,
      updateScanDto,
      image?.path,
      image?.mimetype,
      audio?.path,
      audio?.mimetype,
    );
    return await lastValueFrom<{ message: string }>(
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.SCAN_UPDATE },
        updateScanInternalDto,
      ),
    );
  }

  // ============================================== //
  //     Methods migrated from Admin Controller     //
  // ============================================== //

  createVisit(
    createVisitDto: CreateVisitDto,
    doctorId: number,
    audio?: Express.Multer.File,
  ): void {
    const createVisitInternalDto = new CreateVisitInternalDto(
      createVisitDto,
      doctorId,
      audio?.path,
      audio?.mimetype,
    );
    this.superAdminClient.emit(
      { cmd: SuperAdminPatterns.VISIT_CREATE },
      createVisitInternalDto,
    );
  }

  createMedication(
    createMedicationDto: CreateMedicationDto,
    doctorId: number,
    audio?: Express.Multer.File,
  ): void {
    const createMedicationInternalDto = new CreateMedicationInternalDto(
      createMedicationDto,
      doctorId,
      audio?.path,
      audio?.mimetype,
    );
    this.superAdminClient.emit(
      { cmd: SuperAdminPatterns.MEDICATION_CREATE },
      createMedicationInternalDto,
    );
  }

  uploadLab(
    uploadLabDto: UploadLabDto,
    doctorId: number,
    image?: Express.Multer.File,
    audio?: Express.Multer.File,
  ): void {
    const uploadLabInternalDto = new UploadLabInternalDto(
      uploadLabDto,
      doctorId,
      image?.path ?? '',
      image?.mimetype ?? '',
      audio?.path,
      audio?.mimetype,
    );
    this.superAdminClient.emit(
      { cmd: SuperAdminPatterns.LAB_UPLOAD },
      uploadLabInternalDto,
    );
  }

  uploadScan(
    uploadScanDto: UploadScanDto,
    doctorId: number,
    image?: Express.Multer.File,
    audio?: Express.Multer.File,
  ): void {
    const uploadScanInternalDto = new UploadScanInternalDto(
      uploadScanDto,
      doctorId,
      image?.path ?? '',
      image?.mimetype ?? '',
      audio?.path,
      audio?.mimetype,
    );
    this.superAdminClient.emit(
      { cmd: SuperAdminPatterns.SCAN_UPLOAD },
      uploadScanInternalDto,
    );
  }

  async getPatientVisits(patientGlobalId: string): Promise<{
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
    return await lastValueFrom<{
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
    }>(
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.GET_PATIENT_VISITS },
        patientGlobalId,
      ),
    );
  }

  async getSuperAdminPatients(
    adminId: number,
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
      new DoctorInternalPaginationRequestDto(paginationRequest, adminId);

    return await lastValueFrom<
      PaginationResponse<{
        id: string;
        name: string;
        gender: Gender;
        dateOfBirth: Date;
        socialSecurityNumber: string;
        address: string | null;
        job: string | null;
      }>
    >(
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.GET_SUPER_ADMIN_PATIENTS },
        doctorInternalPaginationRequestDto,
      ),
    );
  }

  async getSuperAdminVisits(
    adminId: number,
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
      superAdmin: {
        name: string;
        id: string;
      };
      createdAt: Date;
    }>
  > {
    const paginationRequest: PaginationRequest = { page, limit };
    const doctorInternalPaginationRequestDto =
      new DoctorInternalPaginationRequestDto(paginationRequest, adminId);

    return await lastValueFrom<
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
    >(
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.GET_SUPER_ADMIN_VISITS },
        doctorInternalPaginationRequestDto,
      ),
    );
  }

  async searchForPatientBySocialSecurityNumber(
    socialSecurityNumber: string,
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
    return await lastValueFrom<{
      id: string;
      name: string;
      gender: Gender;
      dateOfBirth: Date;
      socialSecurityNumber: string;
      address: string | null;
      job: string | null;
      createdAt: Date;
    }>(
      this.superAdminClient.send(
        {
          cmd: SuperAdminPatterns.SEARCH_FOR_PATIENT_BY_SOCIAL_SECURITY_NUMBER,
        },
        socialSecurityNumber,
      ),
    );
  }

  async getPatientMedications(patientGlobalId: string): Promise<{
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
    return await lastValueFrom<{
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
    }>(
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.GET_PATIENT_MEDICATIONS },
        patientGlobalId,
      ),
    );
  }

  async getPatientScans(patientGlobalId: string): Promise<{
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
    return await lastValueFrom<{
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
    }>(
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.GET_PATIENT_SCANS },
        patientGlobalId,
      ),
    );
  }

  async getPatientLabs(patientGlobalId: string): Promise<{
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
    return await lastValueFrom<{
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
    }>(
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.GET_PATIENT_LABS },
        patientGlobalId,
      ),
    );
  }

  async getClinicVisits(
    clinicGlobalId: string,
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
      doctor: {
        name: string;
        speciality: string;
        id: string;
      };
      createdAt: string;
    }>
  > {
    const paginationRequest: PaginationRequest = { page, limit };
    return await lastValueFrom<
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
    >(
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.GET_CLINIC_VISITS },
        { clinicGlobalId, paginationRequest },
      ),
    );
  }

  async getClinicDoctors(
    clinicGlobalId: string,
    page: number,
    limit: number,
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
    const paginationRequest: PaginationRequest = { page, limit };
    return await lastValueFrom<
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
    >(
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.GET_CLINIC_DOCTORS },
        { clinicGlobalId, paginationRequest },
      ),
    );
  }

  async getClinicPatients(
    clinicGlobalId: string,
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
    return await lastValueFrom<
      PaginationResponse<{
        id: string;
        name: string;
        gender: Gender;
        dateOfBirth: Date;
        socialSecurityNumber: string;
        address: string | null;
        job: string | null;
      }>
    >(
      this.superAdminClient.send(
        { cmd: SuperAdminPatterns.GET_CLINIC_PATIENTS },
        { clinicGlobalId, paginationRequest },
      ),
    );
  }
}
