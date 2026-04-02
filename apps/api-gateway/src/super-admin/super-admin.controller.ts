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
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { UpdateDoctorDto, UpdatePatientDto } from '../../../auth/src/dtos';
import { User } from '../../../auth/src/entities';
import { CreateClinicDto } from '../../../super-admin/src/dtos';
import { JwtAuthGuard } from '../auth/guards';
import { SuperAdminService } from './super-admin.service';

@Controller('super-admin')
@Roles(Role.SUPER_ADMIN)
@UseGuards(JwtAuthGuard)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get()
  async isUp(): Promise<string> {
    return await this.superAdminService.isUp();
  }

  @Get('doctors')
  async getAllDoctors(@Query() { page, limit }: PaginationRequest): Promise<
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
    const paginationRequest: PaginationRequest = {
      page,
      limit,
    };
    return await this.superAdminService.getAllDoctors(paginationRequest);
  }

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

  @Get('visits')
  async getAllVisits(@Query() { page, limit }: PaginationRequest): Promise<
    PaginationResponse<{
      id: string;
      diagnoses: string;
      patientId: string;
      doctorId: string;
      createdAt: Date;
    }>
  > {
    const paginationRequest: PaginationRequest = {
      page,
      limit,
    };
    return await this.superAdminService.getAllVisits(paginationRequest);
  }

  @Post('clinic')
  async createClinic(
    @Req() req: Request,
    @Body() createClinicDto: CreateClinicDto,
  ) {
    const user = req.user as User;
    return await this.superAdminService.createClinic(user.id, createClinicDto);
  }

  @Get('clinics')
  async getAllClinics() {
    return await this.superAdminService.getAllClinics();
  }

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
}
