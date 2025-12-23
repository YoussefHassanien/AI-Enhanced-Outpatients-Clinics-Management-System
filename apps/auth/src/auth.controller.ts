import { AuthPatterns, ErrorResponse, Language, Role } from '@app/common';
import { Controller, ParseIntPipe, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import {
  CreateAdminDto,
  CreateDoctorInternalDto,
  CreatePatientDto,
  LoginDto,
} from './dtos';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: AuthPatterns.IS_UP })
  isUp(): string {
    return this.authService.isUp();
  }

  @MessagePattern({ cmd: AuthPatterns.LOGIN })
  async login(@Payload() loginDto: LoginDto): Promise<{
    role: Role;
    name: string;
    language: Language;
    token: string;
  }> {
    return await this.authService.login(loginDto);
  }

  @MessagePattern({ cmd: AuthPatterns.ADMIN_CREATE })
  async adminCreate(
    @Payload() createAdminDto: CreateAdminDto,
  ): Promise<{ message: string; id: string }> {
    const adminGlobalId = await this.authService.createAdmin(createAdminDto);

    return { message: 'Admin is successfully created', id: adminGlobalId };
  }

  @MessagePattern({ cmd: AuthPatterns.DOCTOR_CREATE })
  async doctorCreate(
    @Payload() createDoctorDto: CreateDoctorInternalDto,
  ): Promise<{ message: string; id: string }> {
    const { isApproved, globalId } =
      await this.authService.createDoctor(createDoctorDto);

    return {
      message: isApproved
        ? 'Doctor is successfully created and approved'
        : 'Doctor is successfully created, but waiting for approval',
      id: globalId,
    };
  }

  @MessagePattern({ cmd: AuthPatterns.PATIENT_CREATE })
  async patientCreate(
    @Payload() createPatientDto: CreatePatientDto,
  ): Promise<{ message: string; id: string }> {
    const patientGlobalId =
      await this.authService.createPatient(createPatientDto);

    return { message: 'Patient is successfully created', id: patientGlobalId };
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
  ) {
    return await this.authService.getUser(id);
  }

  @MessagePattern({ cmd: AuthPatterns.GET_DOCTOR_BY_USER_ID })
  async getDoctorByUserId(
    @Payload(
      new ParseIntPipe({
        exceptionFactory: () =>
          new RpcException(new ErrorResponse('Invalid id', 400)),
      }),
    )
    doctorUserId: number,
  ) {
    return await this.authService.getDoctorByUserId(doctorUserId);
  }

  @MessagePattern({ cmd: AuthPatterns.GET_PATIENT_BY_GLOBAL_ID })
  async getPatientByGlobalId(
    @Payload(
      new ParseUUIDPipe({
        exceptionFactory: () =>
          new RpcException(new ErrorResponse('Invalid UUID', 400)),
      }),
    )
    patientGlobalId: string,
  ) {
    return await this.authService.getPatientByGlobalId(patientGlobalId);
  }

  @MessagePattern({ cmd: AuthPatterns.GET_ADMIN_BY_USER_ID })
  async getAdminByUserId(
    @Payload(
      new ParseIntPipe({
        exceptionFactory: () =>
          new RpcException(new ErrorResponse('Invalid id', 400)),
      }),
    )
    adminUserId: number,
  ) {
    return await this.authService.getAdminByUserId(adminUserId);
  }
}
