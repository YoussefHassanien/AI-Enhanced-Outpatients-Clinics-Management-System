import {
  Gender,
  PaginationRequest,
  PaginationResponse,
  Role,
  Roles,
} from '@app/common';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
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
import { DoctorService } from './doctor.service';

@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  async isUp(): Promise<string> {
    return await this.doctorService.isUp();
  }

  @Roles(Role.DOCTOR)
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
    this.doctorService.createVisit(createVisitDto, user.id, audio);
  }

  @Roles(Role.DOCTOR)
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
  @Post('medication')
  createMedication(
    @Body() createMedicationDto: CreateMedicationDto,
    @Req() req: Request,
    @UploadedFile() audio?: Express.Multer.File,
  ): void {
    const user = req.user as User;
    this.doctorService.createMedication(createMedicationDto, user.id, audio);
  }

  @Roles(Role.DOCTOR)
  @UseGuards(JwtAuthGuard)
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
  @Post('lab')
  uploadLab(
    @Body() uploadLabDto: UploadLabDto,
    @UploadedFiles()
    files: { image?: Express.Multer.File[]; audio?: Express.Multer.File[] },
    @Req() req: Request,
  ): void {
    const user = req.user as User;
    this.doctorService.uploadLab(
      uploadLabDto,
      user.id,
      files.image?.[0],
      files.audio?.[0],
    );
  }

  @Roles(Role.DOCTOR)
  @UseGuards(JwtAuthGuard)
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
  @Post('scan')
  uploadScan(
    @Body() uploadScanDto: UploadScanDto,
    @UploadedFiles()
    files: { image?: Express.Multer.File[]; audio?: Express.Multer.File[] },
    @Req() req: Request,
  ): void {
    const user = req.user as User;
    this.doctorService.uploadScan(
      uploadScanDto,

      user.id,
      files.image?.[0],
      files.audio?.[0],
    );
  }

  @Roles(Role.DOCTOR)
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
    return await this.doctorService.getPatientVisits(patientGlobalId);
  }

  @Roles(Role.DOCTOR)
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
    return await this.doctorService.getPatientMedications(patientGlobalId);
  }

  @Roles(Role.DOCTOR)
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
    return await this.doctorService.getPatientScans(patientGlobalId);
  }

  @Roles(Role.DOCTOR)
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
    return await this.doctorService.getPatientLabs(patientGlobalId);
  }

  @Roles(Role.DOCTOR)
  @UseGuards(JwtAuthGuard)
  @Get('patients')
  async getDoctorPatients(
    @Req() req: Request,
    @Query() { page, limit }: PaginationRequest,
  ): Promise<
    PaginationResponse<{
      id: string;
      diagnoses: string;
      patient: {
        name: string;
        id: string;
      };
      createdAt: Date;
    }>
  > {
    const user = req.user as User;
    return await this.doctorService.getDoctorPatients(user.id, page, limit);
  }

  @Roles(Role.DOCTOR)
  @UseGuards(JwtAuthGuard)
  @Get('visits')
  async getDoctorVisits(
    @Req() req: Request,
    @Query() { page, limit }: PaginationRequest,
  ): Promise<
    PaginationResponse<{
      id: string;
      diagnoses: string;
      patient: {
        name: string;
        id: string;
      };
      createdAt: Date;
    }>
  > {
    const user = req.user as User;
    return await this.doctorService.getDoctorVisits(user.id, page, limit);
  }

  @Roles(Role.DOCTOR)
  @UseGuards(JwtAuthGuard)
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
    return await this.doctorService.searchForPatientBySocialSecurityNumber(
      socialSecurityNumber,
    );
  }
}
