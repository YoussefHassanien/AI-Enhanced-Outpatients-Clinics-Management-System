import { Environment, Role, Roles } from '@app/common';
import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import {
  CreateAdminDto,
  CreateDoctorDto,
  CreatePatientDto,
  LoginDto,
} from '../../../auth/src/dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async isUp() {
    return await this.authService.isUp();
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    const cookiesExpirationTime = this.configService.getOrThrow<number>(
      'COOKIES_EXPIRATION_TIME',
    );
    const environment = this.configService.get<string>('ENVIRONMENT');

    res.cookie('accessToken', result.token, {
      httpOnly: true,
      signed: true,
      secure: environment === Environment.PRODUCTION,
      sameSite: environment === Environment.PRODUCTION ? 'none' : 'lax',
      expires: new Date(Date.now() + cookiesExpirationTime),
    });

    return {
      name: result.name,
      language: result.language,
      role: result.role,
    };
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Post('admin/create')
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return await this.authService.createAdmin(createAdminDto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @UseGuards(JwtAuthGuard)
  @Post('doctor/create')
  async createDoctor(@Body() createDoctorDto: CreateDoctorDto) {
    return await this.authService.createDoctor(createDoctorDto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.DOCTOR)
  @UseGuards(JwtAuthGuard)
  @Post('patient/create')
  async createPatient(@Body() createPatientDto: CreatePatientDto) {
    return await this.authService.createPatient(createPatientDto);
  }
}
