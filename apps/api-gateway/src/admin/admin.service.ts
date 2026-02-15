import {
  AdminPatterns,
  Gender,
  Microservices,
  PaginationRequest,
  PaginationResponse,
} from '@app/common';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
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
} from '../../../doctor/src/dtos';

@Injectable()
export class AdminService {
  constructor(
    @Inject(Microservices.ADMIN) private readonly adminClient: ClientProxy,
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
      /(audio\/mpeg|audio\/wave|audio\/mp3|audio\/ogg|audio\/wav)$/;
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
      this.adminClient.send({ cmd: AdminPatterns.IS_UP }, {}),
    );
  }

  async getPatientVisits(patientGlobalId: string): Promise<
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
      this.adminClient.send(
        { cmd: AdminPatterns.GET_PATIENT_VISITS },
        patientGlobalId,
      ),
    );
  }

  async getAdminPatients(
    adminUserId: number,
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
      new DoctorInternalPaginationRequestDto(paginationRequest, adminUserId);

    return await lastValueFrom(
      this.adminClient.send(
        { cmd: AdminPatterns.GET_ADMIN_PATIENTS },
        doctorInternalPaginationRequestDto,
      ),
    );
  }

  async getAdminVisits(
    adminUserId: number,
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
      admin: {
        name: string;
        id: string;
      };
      createdAt: Date;
    }>
  > {
    const paginationRequest: PaginationRequest = { page, limit };

    const doctorInternalPaginationRequestDto =
      new DoctorInternalPaginationRequestDto(paginationRequest, adminUserId);

    return await lastValueFrom(
      this.adminClient.send(
        { cmd: AdminPatterns.GET_ADMIN_VISITS },
        doctorInternalPaginationRequestDto,
      ),
    );
  }

  createVisit(
    createVisitDto: CreateVisitDto,
    userId: number,
    audio?: Express.Multer.File,
  ): void {
    this.validateAudioFile(audio);

    const createVisitInternalDto = new CreateVisitInternalDto(
      createVisitDto,
      userId,
      audio?.path,
      audio?.mimetype,
    );

    this.adminClient.emit(
      { cmd: AdminPatterns.VISIT_CREATE },
      createVisitInternalDto,
    );
  }

  createMedication(
    createMedicationDto: CreateMedicationDto,
    adminUserId: number,
    audio?: Express.Multer.File,
  ): void {
    this.validateAudioFile(audio);

    const createMedicationInternalDto = new CreateMedicationInternalDto(
      createMedicationDto,
      adminUserId,
      audio?.path,
      audio?.mimetype,
    );

    this.adminClient.emit(
      { cmd: AdminPatterns.MEDICATION_CREATE },
      createMedicationInternalDto,
    );
  }

  uploadLab(
    uploadLabDto: UploadLabDto,
    adminUserId: number,
    image?: Express.Multer.File,
    audio?: Express.Multer.File,
  ): void {
    this.validateImageFile(image);
    this.validateAudioFile(audio);

    const uploadLabInternalDto = new UploadLabInternalDto(
      uploadLabDto,
      adminUserId,
      image!.path,
      image!.mimetype,
      audio?.path,
      audio?.mimetype,
    );

    this.adminClient.emit(
      { cmd: AdminPatterns.LAB_UPLOAD },
      uploadLabInternalDto,
    );
  }

  uploadScan(
    uploadScanDto: UploadScanDto,
    adminUserId: number,
    image?: Express.Multer.File,
    audio?: Express.Multer.File,
  ): void {
    this.validateImageFile(image);
    this.validateAudioFile(audio);

    const uploadScanInternalDto = new UploadScanInternalDto(
      uploadScanDto,
      adminUserId,
      image!.path,
      image!.mimetype,
      audio?.path,
      audio?.mimetype,
    );

    this.adminClient.emit(
      { cmd: AdminPatterns.SCAN_UPLOAD },
      uploadScanInternalDto,
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
      this.adminClient.send(
        { cmd: AdminPatterns.SEARCH_FOR_PATIENT_BY_SOCIAL_SECURITY_NUMBER },
        socialSecurityNumber,
      ),
    );
  }
}
