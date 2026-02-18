import { Gender, PaginationResponse, Role, Roles } from '@app/common';
import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../../auth/src/entities';
import {
  MedicationDosage,
  MedicationPeriod,
  ScanTypes,
} from '../../../doctor/src/constants';
import {
  CreateMedicationDto,
  CreateVisitDto,
  UploadLabDto,
  UploadScanDto,
} from '../../../doctor/src/dtos';
import { JwtAuthGuard } from '../auth/guards';
import { AdminService } from './admin.service';

@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  async isUp(): Promise<string> {
    return await this.adminService.isUp();
  }

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
    this.adminService.createVisit(createVisitDto, user.id, audio);
  }

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
    this.adminService.createMedication(createMedicationDto, user.id, audio);
  }

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
    this.adminService.uploadLab(
      uploadLabDto,
      user.id,
      files.image?.[0],
      files.audio?.[0],
    );
  }

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
    this.adminService.uploadScan(
      uploadScanDto,
      user.id,
      files.image?.[0],
      files.audio?.[0],
    );
  }

  @Get('patient/:id/visits')
  async getPatientVisits(
    @Param(
      'id',
      new ParseUUIDPipe({
        exceptionFactory: () => new BadRequestException('Invalid patient ID'),
      }),
    )
    patientGlobalId: string,
  ): Promise<
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
    return await this.adminService.getPatientVisits(patientGlobalId);
  }

  @Get('patients')
  async getAdminPatients(
    @Req() req: Request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
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
    return await this.adminService.getAdminPatients(user.id, page, limit);
  }

  @Get('visits')
  async getAdminVisits(
    @Req() req: Request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
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
    const user = req.user as User;
    return await this.adminService.getAdminVisits(user.id, page, limit);
  }

  @Get('patient/:socialSecurityNumber')
  async searchForPatientBySocialSecurityNumber(
    @Param('socialSecurityNumber') socialSecurityNumber: string,
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
    return await this.adminService.searchForPatientBySocialSecurityNumber(
      socialSecurityNumber,
    );
  }

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
    return await this.adminService.getPatientMedications(patientGlobalId);
  }

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
    return await this.adminService.getPatientScans(patientGlobalId);
  }

  @Get('clinic/visits')
  async getClinicVisits(
    @Req() req: Request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
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
    const user = req.user as User;
    return await this.adminService.getClinicVisits(user.id, page, limit);
  }
}
