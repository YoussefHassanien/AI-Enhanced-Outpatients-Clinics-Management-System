import { Gender, PaginationResponse, Role, Roles } from '@app/common';
import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
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
  @Post('visit/create')
  async createVisit(
    @Body() createVisitDto: CreateVisitDto,
    @Req() req: Request,
    @UploadedFile() audio?: Express.Multer.File,
  ): Promise<void> {
    const user = req.user as User;
    await this.doctorService.createVisit(createVisitDto, user.id, audio);
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
  @Post('medication/create')
  async createMedication(
    @Body() createMedicationDto: CreateMedicationDto,
    @Req() req: Request,
    @UploadedFile() audio?: Express.Multer.File,
  ): Promise<void> {
    const user = req.user as User;
    await this.doctorService.createMedication(
      createMedicationDto,
      user.id,
      audio,
    );
  }

  @Roles(Role.DOCTOR)
  @UseGuards(JwtAuthGuard)
  @Get('patient/:socialSecurityNumber/visits')
  async getPatientVisits(
    @Param('socialSecurityNumber') socialSecurityNumber: string,
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
    return await this.doctorService.getPatientVisits(socialSecurityNumber);
  }

  @Roles(Role.DOCTOR)
  @UseGuards(JwtAuthGuard)
  @Get('patient/:socialSecurityNumber/medications')
  async getPatientMedications(
    @Param('socialSecurityNumber') socialSecurityNumber: string,
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

  @Roles(Role.DOCTOR)
  @UseGuards(JwtAuthGuard)
  @Get('patient/:socialSecurityNumber/scans')
  async getPatientScans(
    @Param('socialSecurityNumber') socialSecurityNumber: string,
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
    return await this.doctorService.getPatientScans(socialSecurityNumber);
  }

  @Roles(Role.DOCTOR)
  @UseGuards(JwtAuthGuard)
  @Get('patient/:socialSecurityNumber/labs')
  async getPatientLabs(
    @Param('socialSecurityNumber') socialSecurityNumber: string,
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
    return await this.doctorService.getPatientLabs(socialSecurityNumber);
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
  @Post('lab/:socialSecurityNumber')
  async uploadLab(
    @Param('socialSecurityNumber') socialSecurityNumber: string,
    @Body() uploadLabDto: UploadLabDto,
    @UploadedFiles()
    files: { image?: Express.Multer.File[]; audio?: Express.Multer.File[] },
    @Req() req: Request,
  ): Promise<void> {
    const user = req.user as User;
    await this.doctorService.uploadLab(
      uploadLabDto,
      socialSecurityNumber,
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
  @Post('scan/:socialSecurityNumber')
  async uploadScan(
    @Param('socialSecurityNumber') socialSecurityNumber: string,
    @Body() uploadScanDto: UploadScanDto,
    @UploadedFiles()
    files: { image?: Express.Multer.File[]; audio?: Express.Multer.File[] },
    @Req() req: Request,
  ): Promise<void> {
    const user = req.user as User;
    await this.doctorService.uploadScan(
      uploadScanDto,
      socialSecurityNumber,
      user.id,
      files.image?.[0],
      files.audio?.[0],
    );
  }

  @Roles(Role.DOCTOR)
  @UseGuards(JwtAuthGuard)
  @Get('patients')
  async getDoctorPatients(
    @Req() req: Request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
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
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
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
