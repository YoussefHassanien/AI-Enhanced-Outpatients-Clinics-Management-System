import { AuthPatterns, ErrorResponse } from '@app/common';
import {
  Controller,
  Logger,
  ParseIntPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
  RpcException,
} from '@nestjs/microservices';
import { AuthService } from './auth.service';
import {
  CreateAdminDto,
  CreateDoctorInternalDto,
  CreatePatientDto,
  LoginDto,
} from './dtos';

@Controller()
export class AuthController {
  private readonly logger: Logger;

  constructor(private readonly authService: AuthService) {
    this.logger = new Logger(AuthController.name);
  }

  @MessagePattern({ cmd: AuthPatterns.IS_UP })
  isUp(@Ctx() context: RmqContext): string {
    this.logger.log(
      `Message of fields: ${JSON.stringify(context.getMessage().fields)} and properties: ${JSON.stringify(context.getMessage().properties)} received with Pattern: ${context.getPattern()}`,
    );

    return this.authService.isUp();
  }

  @MessagePattern({ cmd: AuthPatterns.LOGIN })
  async login(@Payload() loginDto: LoginDto, @Ctx() context: RmqContext) {
    this.logger.log(
      `Message of fields: ${JSON.stringify(context.getMessage().fields)} and properties: ${JSON.stringify(context.getMessage().properties)} received with Pattern: ${context.getPattern()}`,
    );

    const credentials = await this.authService.login(loginDto);

    if (credentials instanceof RpcException) {
      this.logger.error(credentials.getError());
      throw credentials;
    }

    return credentials;
  }

  @MessagePattern({ cmd: AuthPatterns.ADMIN_CREATE })
  async adminCreate(
    @Payload() createAdminDto: CreateAdminDto,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(
      `Message of fields: ${JSON.stringify(context.getMessage().fields)} and properties: ${JSON.stringify(context.getMessage().properties)} received with Pattern: ${context.getPattern()}`,
    );

    const admin = await this.authService.createAdmin(createAdminDto);

    if (admin instanceof RpcException) {
      this.logger.error(admin.getError());
      throw admin;
    }

    return { message: 'Admin is successfully created', id: admin.globalId };
  }

  @MessagePattern({ cmd: AuthPatterns.DOCTOR_CREATE })
  async doctorCreate(
    @Payload() createDoctorDto: CreateDoctorInternalDto,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(
      `Message of fields: ${JSON.stringify(context.getMessage().fields)} and properties: ${JSON.stringify(context.getMessage().properties)} received with Pattern: ${context.getPattern()}`,
    );

    const doctor = await this.authService.createDoctor(createDoctorDto);

    if (doctor instanceof RpcException) {
      this.logger.error(doctor.getError());
      throw doctor;
    }

    return {
      message: doctor.isApproved
        ? 'Doctor is successfully created and approved'
        : 'Doctor is successfully created, but waiting for approval',
      id: doctor.globalId,
    };
  }

  @MessagePattern({ cmd: AuthPatterns.PATIENT_CREATE })
  async patientCreate(
    @Payload() createPatientDto: CreatePatientDto,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(
      `Message of fields: ${JSON.stringify(context.getMessage().fields)} and properties: ${JSON.stringify(context.getMessage().properties)} received with Pattern: ${context.getPattern()}`,
    );

    const patient = await this.authService.createPatient(createPatientDto);

    if (patient instanceof RpcException) {
      this.logger.error(patient.getError());
      throw patient;
    }

    return { message: 'Patient is successfully created', id: patient.globalId };
  }

  @MessagePattern({ cmd: AuthPatterns.GET_USER })
  async getUser(
    @Payload(
      new ParseIntPipe({
        exceptionFactory: () =>
          new RpcException(new ErrorResponse('Invalid id', 400)),
      }),
    )
    id: number,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(
      `Message of fields: ${JSON.stringify(context.getMessage().fields)} and properties: ${JSON.stringify(context.getMessage().properties)} received with Pattern: ${context.getPattern()}`,
    );

    return await this.authService.getUser(id);
  }

  @MessagePattern({ cmd: AuthPatterns.GET_DOCTOR_BY_USER_ID })
  async getDoctor(
    @Payload(
      new ParseIntPipe({
        exceptionFactory: () =>
          new RpcException(new ErrorResponse('Invalid id', 400)),
      }),
    )
    doctorUserId: number,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(
      `Message of fields: ${JSON.stringify(context.getMessage().fields)} and properties: ${JSON.stringify(context.getMessage().properties)} received with Pattern: ${context.getPattern()}`,
    );

    return await this.authService.getDoctorByUserId(doctorUserId);
  }

  @MessagePattern({ cmd: AuthPatterns.GET_PATIENT_BY_GLOBAL_ID })
  async getPatient(
    @Payload(
      new ParseUUIDPipe({
        exceptionFactory: () =>
          new RpcException(new ErrorResponse('Invalid UUID', 400)),
      }),
    )
    patientGlobalId: string,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(
      `Message of fields: ${JSON.stringify(context.getMessage().fields)} and properties: ${JSON.stringify(context.getMessage().properties)} received with Pattern: ${context.getPattern()}`,
    );

    return await this.authService.getPatientByGlobalId(patientGlobalId);
  }

  @MessagePattern({ cmd: AuthPatterns.GET_ADMIN_BY_USER_ID })
  async getAdmin(
    @Payload(
      new ParseIntPipe({
        exceptionFactory: () =>
          new RpcException(new ErrorResponse('Invalid id', 400)),
      }),
    )
    adminUserId: number,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(
      `Message of fields: ${JSON.stringify(context.getMessage().fields)} and properties: ${JSON.stringify(context.getMessage().properties)} received with Pattern: ${context.getPattern()}`,
    );

    return await this.authService.getAdminByUserId(adminUserId);
  }
}
