import { ErrorResponse } from '@app/common';
import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
  RpcException,
} from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { AuthPatterns } from './constants';
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

    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    if (!user) {
      const rpcException = new RpcException(
        new ErrorResponse('Invalid credentials', 401),
      );
      this.logger.error(rpcException.getError());
      throw rpcException;
    }

    const credentials = await this.authService.generateCredentials(user);

    return {
      ...credentials,
      role: user.role,
    };
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
        ? 'Doctor is successfully created'
        : 'Doctor is waiting for being approved',
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
  async getUser(@Payload() id: number, @Ctx() context: RmqContext) {
    this.logger.log(
      `Message of fields: ${JSON.stringify(context.getMessage().fields)} and properties: ${JSON.stringify(context.getMessage().properties)} received with Pattern: ${context.getPattern()}`,
    );

    return await this.authService.getUser(id);
  }
}
