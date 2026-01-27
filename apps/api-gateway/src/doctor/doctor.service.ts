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
  UploadLabDto,
  UploadLabInternalDto,
  UploadScanDto,
  UploadScanInternalDto,
} from '../../../doctor/src/dtos';

@Injectable()
export class DoctorService {
  constructor(
    @Inject(Microservices.DOCTOR) private readonly doctorClient: ClientProxy,
  ) {}

  private validateSocialSecurityNumber(socialSecurityNumber: string): void {
    const regex = /^[23]\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{7}$/;
    if (!regex.test(socialSecurityNumber)) {
      throw new BadRequestException('Invalid social security number format');
    }
  }

  private validateImageFile(image?: Express.Multer.File) {
    const imageTypeRegExp: RegExp = /(image\/jpeg|image\/jpg|image\/png)$/;
    const imageSize: number = 5 * 1024 * 1024; // 5 MB

    if (!image) {
      throw new BadRequestException('Image file is required');
    }

    if (!imageTypeRegExp.test(image.mimetype)) {
      throw new BadRequestException('Invalid image file type');
    }

    if (image.size > imageSize) {
      throw new BadRequestException('Image file too large');
    }
  }

  private validateAudioFile(audio?: Express.Multer.File) {
    const audioTypeRegExp: RegExp =
      /(audio\/mpeg|audio\/wav|audio\/mp3|audio\/ogg)$/;
    const audioSize: number = 10 * 1024 * 1024; // 10 MB

    if (audio) {
      if (!audioTypeRegExp.test(audio.mimetype)) {
        throw new BadRequestException('Invalid audio file type');
      }

      if (audio.size > audioSize) {
        throw new BadRequestException('Audio file too large');
      }
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

  async uploadLab(
    uploadLabDto: UploadLabDto,
    patientSocialSecurityNumber: string,
    doctorUserId: number,
    image?: Express.Multer.File,
    audio?: Express.Multer.File,
  ): Promise<void> {
    this.validateImageFile(image);
    this.validateAudioFile(audio);
    this.validateSocialSecurityNumber(patientSocialSecurityNumber);

    const uploadLabInternalDto = new UploadLabInternalDto(
      uploadLabDto,
      patientSocialSecurityNumber,
      doctorUserId,
      image!.buffer.toString('base64'),
      image!.mimetype,
      audio?.buffer.toString('base64'),
      audio?.mimetype,
    );

    await lastValueFrom<void>(
      this.doctorClient.emit(
        { cmd: DoctorPatterns.LAB_UPLOAD },
        uploadLabInternalDto,
      ),
    );
  }

  async uploadScan(
    uploadScanDto: UploadScanDto,
    patientSocialSecurityNumber: string,
    doctorUserId: number,
    image?: Express.Multer.File,
    audio?: Express.Multer.File,
  ): Promise<void> {
    this.validateImageFile(image);
    this.validateAudioFile(audio);
    this.validateSocialSecurityNumber(patientSocialSecurityNumber);

    const uploadScanInternalDto = new UploadScanInternalDto(
      uploadScanDto,
      patientSocialSecurityNumber,
      doctorUserId,
      image!.buffer.toString('base64'),
      image!.mimetype,
      audio?.buffer.toString('base64'),
      audio?.mimetype,
    );

    await lastValueFrom<void>(
      this.doctorClient.emit(
        { cmd: DoctorPatterns.SCAN_UPLOAD },
        uploadScanInternalDto,
      ),
    );
  }

  async getDoctorVisits(
    doctorUserId: number,
    page?: number,
    limit?: number,
  ): Promise<{
    page: number;
    items: {
      id: string;
      diagnoses: string;
      patient: {
        name: string;
        id: string;
      };
      createdAt: Date;
    }[];
    totalItems: number;
    totalPages: number;
  }> {
    return await lastValueFrom<{
      page: number;
      items: {
        id: string;
        diagnoses: string;
        patient: {
          name: string;
          id: string;
        };
        createdAt: Date;
      }[];
      totalItems: number;
      totalPages: number;
    }>(
      this.doctorClient.send(
        { cmd: DoctorPatterns.GET_DOCTOR_VISITS },
        { doctorUserId, page, limit },
      ),
    );
  }

  async getDoctorPatients(
    doctorUserId: number,
    page?: number,
    limit?: number,
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
    return await lastValueFrom<{
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
    }>(
      this.doctorClient.send(
        { cmd: DoctorPatterns.GET_DOCTOR_PATIENTS },
        { doctorUserId, page, limit },
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
    job: string;
    address: string;
    createdAt: Date;
  }> {
    return await lastValueFrom<{
      id: string;
      name: string;
      gender: Gender;
      dateOfBirth: Date;
      socialSecurityNumber: string;
      job: string;
      address: string;
      createdAt: Date;
    }>(
      this.doctorClient.send(
        { cmd: DoctorPatterns.SEARCH_FOR_PATIENT_BY_SOCIAL_SECURITY_NUMBER },
        socialSecurityNumber,
      ),
    );
  }
}
