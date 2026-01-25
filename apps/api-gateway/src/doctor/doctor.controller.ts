import { Gender, Role, Roles } from '@app/common';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from '../../../auth/src/entities';
import {
  MedicationDosage,
  MedicationPeriod,
  ScanTypes,
} from '../../../doctor/src/constants';
import { CreateMedicationDto, CreateVisitDto } from '../../../doctor/src/dtos';
import { JwtAuthGuard } from '../auth/guards';
import { DoctorService } from './doctor.service';

@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) { }

  @Get()
  async isUp(): Promise<string> {
    return await this.doctorService.isUp();
  }

  @Roles(Role.DOCTOR)
  @UseGuards(JwtAuthGuard)
  @Post('visit/create')
  async createVisit(
    @Body() createVisitDto: CreateVisitDto,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const user = req.user as User;
    return await this.doctorService.createVisit(createVisitDto, user.id);
  }

  @Roles(Role.DOCTOR)
  @UseGuards(JwtAuthGuard)
  @Post('medication/create')
  async createMedication(
    @Body() createMedicationDto: CreateMedicationDto,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const user = req.user as User;
    return await this.doctorService.createMedication(
      createMedicationDto,
      user.id,
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
  @Get('patients')
  async getDoctorPatients(
    @Req() req: Request,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
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
    const user = req.user as User;
    return await this.doctorService.getDoctorPatients(user.id, page, limit);
  }

  @Roles(Role.DOCTOR)
  @UseGuards(JwtAuthGuard)
  @Get('visits')
  async getDoctorVisits(
    @Req() req: Request,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
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
    const user = req.user as User;
    return await this.doctorService.getDoctorVisits(user.id, page, limit);
  }
}
