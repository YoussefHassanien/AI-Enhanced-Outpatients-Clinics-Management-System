import {
  Gender,
  PaginationRequest,
  PaginationResponse,
  Role,
  Roles,
} from '@app/common';
import {
  MedicationDosage,
  MedicationPeriod,
  ScanTypes,
} from '../../../doctor/src/constants';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Delete,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UpdateDoctorDto, UpdatePatientDto } from '../../../auth/src/dtos';
import { User } from '../../../auth/src/entities';
import {
  CreateClinicDto,
  UpdateClinicDto,
} from '../../../super-admin/src/dtos';
import { JwtAuthGuard } from '../auth/guards';
import { SuperAdminService } from './super-admin.service';
import {
  CreateMedicationDto,
  CreateVisitDto,
  UploadLabDto,
  UploadScanDto,
  UpdateLabDto,
  UpdateMedicationDto,
  UpdateScanDto,
  UpdateVisitDto,
} from '../../../doctor/src/dtos';

@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) { }

  @Get()
  async isUp(): Promise<string> {
    return await this.superAdminService.isUp();
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Get('doctors')
  async getAllDoctors(@Query() paginationRequest: PaginationRequest): Promise<
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
    return await this.superAdminService.getAllDoctors(paginationRequest);
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Get('patients')
  async getAllPatients(@Query() { page, limit }: PaginationRequest): Promise<
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
    const paginationRequest: PaginationRequest = {
      page,
      limit,
    };
    return await this.superAdminService.getAllPatients(paginationRequest);
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Get('visits')
  async getAllVisits(@Query() { page, limit }: PaginationRequest): Promise<
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
    const paginationRequest: PaginationRequest = {
      page,
      limit,
    };
    return await this.superAdminService.getAllVisits(paginationRequest);
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Post('clinic')
  async createClinic(
    @Req() req: Request,
    @Body() createClinicDto: CreateClinicDto,
  ) {
    const user = req.user as User;
    return await this.superAdminService.createClinic(user.id, createClinicDto);
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Patch('clinic/:id')
  async updateClinic(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClinicDto: UpdateClinicDto,
  ) {
    return await this.superAdminService.updateClinic(id, updateClinicDto);
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Delete('clinic/:id')
  async deleteClinic(@Param('id', ParseUUIDPipe) id: string) {
    return await this.superAdminService.deleteClinic(id);
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Patch('clinic/:id/restore')
  async restoreClinic(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return await this.superAdminService.restoreClinic(id);
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Get('clinics')
  async getAllClinics(@Query() paginationRequest: PaginationRequest) {
    return await this.superAdminService.getAllClinics(paginationRequest);
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Get('patient/:id')
  async getPatientByGlobalId(
    @Param(
      'id',
      new ParseUUIDPipe({
        exceptionFactory: () => new BadRequestException('Invalid patient ID'),
      }),
    )
    globalId: string,
  ) {
    return await this.superAdminService.getPatientByGlobalId(globalId);
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Patch('patient/:id')
  async updatePatient(
    @Param(
      'id',
      new ParseUUIDPipe({
        exceptionFactory: () => new BadRequestException('Invalid patient ID'),
      }),
    )
    globalId: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ): Promise<{ message: string }> {
    return await this.superAdminService.updatePatient(
      globalId,
      updatePatientDto,
    );
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Get('doctor/:id')
  async getDoctorByGlobalId(
    @Param(
      'id',
      new ParseUUIDPipe({
        exceptionFactory: () => new BadRequestException('Invalid doctor ID'),
      }),
    )
    globalId: string,
  ) {
    return await this.superAdminService.getDoctorByGlobalId(globalId);
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Patch('doctor/:id')
  async updateDoctor(
    @Param(
      'id',
      new ParseUUIDPipe({
        exceptionFactory: () => new BadRequestException('Invalid doctor ID'),
      }),
    )
    globalId: string,
    @Body() updateDoctorDto: UpdateDoctorDto,
  ): Promise<{ message: string }> {
    return await this.superAdminService.updateDoctor(globalId, updateDoctorDto);
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Delete('doctor/:id')
  async deleteDoctor(
    @Param(
      'id',
      new ParseUUIDPipe({
        exceptionFactory: () => new BadRequestException('Invalid doctor ID'),
      }),
    )
    globalId: string,
  ): Promise<{ message: string }> {
    return await this.superAdminService.deleteDoctor(globalId);
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Patch('doctor/:id/restore')
  async restoreDoctor(
    @Param(
      'id',
      new ParseUUIDPipe({
        exceptionFactory: () => new BadRequestException('Invalid doctor ID'),
      }),
    )
    globalId: string,
  ): Promise<{ message: string }> {
    return await this.superAdminService.restoreDoctor(globalId);
  }


  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Patch('visit/:id')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: process.env.ASR_TMP_DIR,
        filename: (req, file, cb) => {
          const randomName = uuidv4();
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async updateVisit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVisitDto: UpdateVisitDto,
    @UploadedFile() audio?: Express.Multer.File,
  ): Promise<{ message: string }> {
    return await this.superAdminService.updateVisit(id, updateVisitDto, audio);
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Patch('medication/:id')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: process.env.ASR_TMP_DIR,
        filename: (req, file, cb) => {
          const randomName = uuidv4();
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async updateMedication(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMedicationDto: UpdateMedicationDto,
    @UploadedFile() audio?: Express.Multer.File,
  ): Promise<{ message: string }> {
    return await this.superAdminService.updateMedication(id, updateMedicationDto, audio);
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Patch('lab/:id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'audio', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: process.env.ASR_TMP_DIR,
          filename: (req, file, cb) => {
            const randomName = uuidv4();
            cb(null, `${randomName}${extname(file.originalname)}`);
          },
        }),
      },
    ),
  )
  async updateLab(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLabDto: UpdateLabDto,
    @UploadedFiles()
    files: { image?: Express.Multer.File[]; audio?: Express.Multer.File[] },
  ): Promise<{ message: string }> {
    return await this.superAdminService.updateLab(
      id,
      updateLabDto,
      files.image?.[0],
      files.audio?.[0],
    );
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Patch('scan/:id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'audio', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: process.env.ASR_TMP_DIR,
          filename: (req, file, cb) => {
            const randomName = uuidv4();
            cb(null, `${randomName}${extname(file.originalname)}`);
          },
        }),
      },
    ),
  )
  async updateScan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateScanDto: UpdateScanDto,
    @UploadedFiles()
    files: { image?: Express.Multer.File[]; audio?: Express.Multer.File[] },
  ): Promise<{ message: string }> {
    return await this.superAdminService.updateScan(
      id,
      updateScanDto,
      files.image?.[0],
      files.audio?.[0],
    );
  }

  // ============================================== //
  //     Methods migrated from Admin Controller     //
  // ============================================== //

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: process.env.ASR_TMP_DIR,
        filename: (req, file, cb) => {
          const randomName = uuidv4();
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @Post('visit')
  createVisit(
    @Body() createVisitDto: CreateVisitDto,
    @Req() req: Request,
    @UploadedFile() audio?: Express.Multer.File,
  ): void {
    const user = req.user as User;
    this.superAdminService.createVisit(createVisitDto, user.id, audio);
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Post('medication')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: process.env.ASR_TMP_DIR,
        filename: (req, file, cb) => {
          const randomName = uuidv4();
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  createMedication(
    @Body() createMedicationDto: CreateMedicationDto,
    @Req() req: Request,
    @UploadedFile() audio?: Express.Multer.File,
  ): void {
    const user = req.user as User;
    this.superAdminService.createMedication(createMedicationDto, user.id, audio);
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Post('lab')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'audio', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: process.env.ASR_TMP_DIR,
          filename: (req, file, cb) => {
            const randomName = uuidv4();
            cb(null, `${randomName}${extname(file.originalname)}`);
          },
        }),
      },
    ),
  )
  uploadLab(
    @Body() uploadLabDto: UploadLabDto,
    @UploadedFiles()
    files: { image?: Express.Multer.File[]; audio?: Express.Multer.File[] },
    @Req() req: Request,
  ): void {
    const user = req.user as User;
    this.superAdminService.uploadLab(
      uploadLabDto,
      user.id,
      files.image?.[0],
      files.audio?.[0],
    );
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Post('scan')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'audio', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: process.env.ASR_TMP_DIR,
          filename: (req, file, cb) => {
            const randomName = uuidv4();
            cb(null, `${randomName}${extname(file.originalname)}`);
          },
        }),
      },
    ),
  )
  uploadScan(
    @Body() uploadScanDto: UploadScanDto,
    @UploadedFiles()
    files: { image?: Express.Multer.File[]; audio?: Express.Multer.File[] },
    @Req() req: Request,
  ): void {
    const user = req.user as User;
    this.superAdminService.uploadScan(
      uploadScanDto,
      user.id,
      files.image?.[0],
      files.audio?.[0],
    );
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Get('patient/:id/visits')
  async getPatientVisits(
    @Param(
      'id',
      new ParseUUIDPipe({
        exceptionFactory: () => new BadRequestException('Invalid patient ID'),
      }),
    )
    patientGlobalId: string,
  ): Promise<{
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

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Get('managed-patients')
  async getSuperAdminPatients(
    @Req() req: Request,
    @Query() { page, limit }: PaginationRequest,
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
    const user = req.user as User;
    return await this.superAdminService.getSuperAdminPatients(user.id, page, limit);
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Get('managed-visits')
  async getSuperAdminVisits(
    @Req() req: Request,
    @Query() { page, limit }: PaginationRequest,
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
    const user = req.user as User;
    return await this.superAdminService.getSuperAdminVisits(user.id, page, limit);
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Get('patient-search/:socialSecurityNumber')
  async searchForPatientBySocialSecurityNumber(
    @Param('socialSecurityNumber') socialSecurityNumber: string,
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
    return await this.superAdminService.searchForPatientBySocialSecurityNumber(
      socialSecurityNumber,
    );
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Get('patient/:id/medications')
  async getPatientMedications(
    @Param(
      'id',
      new ParseUUIDPipe({
        exceptionFactory: () => new BadRequestException('Invalid patient ID'),
      }),
    )
    patientGlobalId: string,
  ): Promise<{
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

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Get('patient/:id/scans')
  async getPatientScans(
    @Param(
      'id',
      new ParseUUIDPipe({
        exceptionFactory: () => new BadRequestException('Invalid patient ID'),
      }),
    )
    patientGlobalId: string,
  ): Promise<{
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

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Get('patient/:id/labs')
  async getPatientLabs(
    @Param(
      'id',
      new ParseUUIDPipe({
        exceptionFactory: () => new BadRequestException('Invalid patient ID'),
      }),
    )
    patientGlobalId: string,
  ): Promise<{
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

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Get('clinic/:clinicId/visits')
  async getClinicVisits(
    @Param('clinicId') clinicGlobalId: string,
    @Query() { page, limit }: PaginationRequest,
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
    return await this.superAdminService.getClinicVisits(clinicGlobalId, page, limit);
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Get('clinic/:clinicId/doctors')
  async getClinicDoctors(
    @Param('clinicId') clinicGlobalId: string,
    @Query() { page, limit }: PaginationRequest,
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
    return await this.superAdminService.getClinicDoctors(clinicGlobalId, page, limit);
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Get('clinic/:clinicId/patients')
  async getClinicPatients(
    @Param('clinicId') clinicGlobalId: string,
    @Query() { page, limit }: PaginationRequest,
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
    return await this.superAdminService.getClinicPatients(clinicGlobalId, page, limit);
  }
}
