import { Environment } from '@app/common';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CreateDoctorDto, CreatePatientDto, LoginDto } from './dto';
import { User } from './entities';
import { JwtAuthGuard, LocalAuthGuard } from './guards';

@Controller('auth')
export class AuthController {
  private readonly cookiesExpirationTime: number;
  private readonly environment: Environment;
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.cookiesExpirationTime = this.configService.getOrThrow<number>(
      'COOKIES_EXPIRATION_TIME',
    );

    this.environment =
      this.configService.getOrThrow<Environment>('ENVIRONMENT');
  }

  @Get()
  getHello(): string {
    return this.authService.getHello();
  }

  @UseGuards(LocalAuthGuard)
  @Post('doctor/login')
  async doctorLogin(
    @Req() req: Request,
    @Res() res: Response,
    @Body() loginDto: LoginDto,
  ) {
    const credentials = await this.authService.generateCredentials(
      req.user as User,
    );
    this.setAuthCookies(res, credentials.token);

    return res.status(201).json({
      name: credentials.name,
      language: credentials.language,
    });
  }

  @Post('doctor/create')
  async doctorCreate(
    @Res() res: Response,
    @Body() createDoctorDto: CreateDoctorDto,
  ) {
    const doctor = await this.authService.createDoctor(createDoctorDto);

    if (!doctor) {
      throw new BadRequestException({ message: 'Failed to create doctor' });
    }

    return res.status(201).json({
      message: 'Doctor is successfully created',
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('patient/create')
  async patientCreate(
    @Res() res: Response,
    @Body() createPatientDto: CreatePatientDto,
  ) {
    const patient = await this.authService.createPatient(createPatientDto);

    if (!patient) {
      throw new BadRequestException({ message: 'Failed to create doctor' });
    }

    return res.status(201).json({
      message: 'Patient is successfully created',
    });
  }

  private setAuthCookies(res: Response, accessToken: string) {
    const cookieOptions = {
      expires: new Date(Date.now() + this.cookiesExpirationTime),
      httpOnly: true,
      signed: true,
      secure: this.environment === Environment.PRODUCTION ? true : false,
      sameSite:
        this.environment === Environment.DEVELOPMENT
          ? ('lax' as const)
          : ('none' as const),
    };

    res.cookie('accessToken', accessToken, cookieOptions);
  }
}
