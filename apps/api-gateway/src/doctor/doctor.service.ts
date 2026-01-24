import { DoctorPatterns, Gender, Microservices } from '@app/common';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  MedicationDosage,
  MedicationPeriod,
  ScanTypes,
} from '../../../doctor/src/constants';
import {
  CreateMedicationDto,
  CreateMedicationInternalDto,
  CreateVisitDto,
  CreateVisitInternalDto,
} from '../../../doctor/src/dtos';

@Injectable()
export class DoctorService {
  constructor(
    @Inject(Microservices.DOCTOR) private readonly doctorClient: ClientProxy,
  ) { }

  private validateSocialSecurityNumber(socialSecurityNumber: string): void {
    const regex = /^[23]\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{7}$/;
    if (!regex.test(socialSecurityNumber)) {
      throw new BadRequestException('Invalid social security number format');
    }
  }
  async isUp(): Promise<string> {
    return await lastValueFrom<string>(
      this.doctorClient.send({ cmd: DoctorPatterns.IS_UP }, {}),
    );
  }

  async createVisit(
    createVisitDto: CreateVisitDto,
    userId: number,
  ): Promise<{ message: string }> {
    const createVisitInternalDto = new CreateVisitInternalDto(
      createVisitDto,
      userId,
    );

    return await lastValueFrom<{ message: string }>(
      this.doctorClient.send(
        { cmd: DoctorPatterns.VISIT_CREATE },
        createVisitInternalDto,
      ),
    );
  }

  async createMedication(
    createMedicationDto: CreateMedicationDto,
    userId: number,
  ): Promise<{ message: string }> {
    const createMedicationInternalDto = new CreateMedicationInternalDto(
      createMedicationDto,
      userId,
    );

    return await lastValueFrom<{ message: string }>(
      this.doctorClient.send(
        { cmd: DoctorPatterns.MEDICATION_CREATE },
        createMedicationInternalDto,
      ),
    );
  }

  async getPatientVisits(socialSecurityNumber: string): Promise<
    {
      patient: {
        id: string;
        name: string;
        gender: Gender;
        dateOfBirth: Date;
        socialSecurityNumber: string;
        address: string;
        job: string;
      };
      clinic: {
        id: string;
        name: string;
        visits: {
          doctor: {
            name: string;
            speciality: string;
          };
          diagnoses: string;
        }[];
      };
    }[]
  > {
    this.validateSocialSecurityNumber(socialSecurityNumber);
    return await lastValueFrom<
      {
        patient: {
          id: string;
          name: string;
          gender: Gender;
          dateOfBirth: Date;
          socialSecurityNumber: string;
          address: string;
          job: string;
        };
        clinic: {
          id: string;
          name: string;
          visits: {
            doctor: {
              name: string;
              speciality: string;
            };
            diagnoses: string;
          }[];
        };
      }[]
    >(
      this.doctorClient.send(
        { cmd: DoctorPatterns.GET_PATIENT_VISITS },
        socialSecurityNumber,
      ),
    );
  }

  async getPatientMedications(socialSecurityNumber: string): Promise<{
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
    this.validateSocialSecurityNumber(socialSecurityNumber);
    return await lastValueFrom(
      this.doctorClient.send<{
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
      }>({ cmd: DoctorPatterns.GET_PATIENT_MEDICATIONS }, socialSecurityNumber),
    );
  }

  async getPatientScans(socialSecurityNumber: string): Promise<{
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
    this.validateSocialSecurityNumber(socialSecurityNumber);
    return await lastValueFrom<{
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
    }>(
      this.doctorClient.send(
        { cmd: DoctorPatterns.GET_PATIENT_SCANS },
        socialSecurityNumber,
      ),
    );
  }

  async getPatientLabs(socialSecurityNumber: string): Promise<{
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
    this.validateSocialSecurityNumber(socialSecurityNumber);
    return await lastValueFrom<{
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
    }>(
      this.doctorClient.send(
        { cmd: DoctorPatterns.GET_PATIENT_LABS },
        socialSecurityNumber,
      ),
    );
  }

  async getDoctorPatients(
    doctorUserId: number,
    page?: number,
    limit?: number,
  ): Promise<{
    patient: {
      id: string;
      name: string;
      gender: Gender;
      dateOfBirth: Date;
      socialSecurityNumber: string;
      address: string;
      job: string;
    }[];
    total: number;
    page: number;
    limit: number;
  }> {
    return await lastValueFrom<{
      patient: {
        id: string;
        name: string;
        gender: Gender;
        dateOfBirth: Date;
        socialSecurityNumber: string;
        address: string;
        job: string;
      }[];
      total: number;
      page: number;
      limit: number;
    }>(
      this.doctorClient.send(
        { cmd: DoctorPatterns.GET_DOCTOR_PATIENTS },
        { doctorUserId, page, limit },
      ),
    );
  }

  async getDoctorVisits(
    doctorUserId: number,
    page?: number,
    limit?: number,
  ): Promise<{
    visits: {
      id: string;
      diagnoses: string;
      patientName: string;
      patientSocialSecurityNumber: string;
      createdAt: Date;
    }[];
    total: number;
    page: number;
    limit: number;
  }> {
    return await lastValueFrom<{
      visits: {
        id: string;
        diagnoses: string;
        patientName: string;
        patientSocialSecurityNumber: string;
        createdAt: Date;
      }[];
      total: number;
      page: number;
      limit: number;
    }>(
      this.doctorClient.send(
        { cmd: DoctorPatterns.GET_DOCTOR_VISITS },
        { doctorUserId, page, limit },
      ),
    );
  }
}
