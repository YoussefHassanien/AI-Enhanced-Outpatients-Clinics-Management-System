import { Role, Roles } from '@app/common';
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { User } from '../../../auth/src/entities';
import { CreateMedicationDto, CreateVisitDto } from '../../../doctor/src/dtos';
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
}
