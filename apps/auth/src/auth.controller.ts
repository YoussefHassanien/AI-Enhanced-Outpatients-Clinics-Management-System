import {
  AuthPatterns,
  ErrorResponse,
  Gender,
  Language,
  PaginationRequest,
  PaginationResponse,
  Role,
} from '@app/common';
import { Controller, ParseIntPipe, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { ClinicInternalPaginationRequestDto } from '../../super-admin/src/dtos';
import { AuthService } from './auth.service';
import {
  CreateDoctorInternalDto,
  CreatePatientDto,
  LoginDto,
  UpdateDoctorInternalDto,
  UpdatePatientInternalDto,
} from './dtos';
import { Doctor, Patient, SuperAdmin, User } from './entities';

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
  ): Promise<User | null> {
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
  ): Promise<Doctor | null> {
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
  ): Promise<Patient | null> {
    return await this.authService.getPatientByGlobalId(patientGlobalId);
  }


  @MessagePattern({ cmd: AuthPatterns.GET_ALL_DOCTORS })
  async getAllDoctors(@Payload() paginationRequest: PaginationRequest): Promise<
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
    return await this.authService.getAllDoctors(paginationRequest);
  }

  @MessagePattern({ cmd: AuthPatterns.GET_ALL_PATIENTS })
  async getAllPatients(
    @Payload() paginationRequest: PaginationRequest,
  ): Promise<
    PaginationResponse<{
      id: string;
      address: string | null;
      job: string | null;
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
    return await this.authService.getAllPatients(paginationRequest);
  }

  @MessagePattern({ cmd: AuthPatterns.GET_DOCTOR_BY_ID })
  async getDoctorById(
    @Payload(
      new ParseIntPipe({
        exceptionFactory: () =>
          new RpcException(new ErrorResponse('Invalid id', 400)),
      }),
    )
    id: number,
  ): Promise<Doctor | null> {
    return await this.authService.getDoctorById(id);
  }

  @MessagePattern({ cmd: AuthPatterns.GET_PATIENT_BY_ID })
  async getPatientById(
    @Payload(
      new ParseIntPipe({
        exceptionFactory: () =>
          new RpcException(new ErrorResponse('Invalid id', 400)),
      }),
    )
    id: number,
  ): Promise<Patient | null> {
    return await this.authService.getPatientById(id);
  }

  @MessagePattern({ cmd: AuthPatterns.PATIENT_UPDATE })
  async patientUpdate(
    @Payload() updatePatientInternalDto: UpdatePatientInternalDto,
  ): Promise<{ message: string }> {
    return await this.authService.updatePatient(updatePatientInternalDto);
  }

  @MessagePattern({ cmd: AuthPatterns.GET_PATIENT_BY_SOCIAL_SECURITY_NUMBER })
  async getPatientBySocialSecurityNumber(
    @Payload()
    socialSecurityNumber: string,
  ): Promise<Patient | null> {
    return await this.authService.getPatientBySocialSecurityNumber(
      socialSecurityNumber,
    );
  }

  @MessagePattern({ cmd: AuthPatterns.GET_DOCTOR_BY_GLOBAL_ID })
  async getDoctorByGlobalId(
    @Payload(
      new ParseUUIDPipe({
        exceptionFactory: () =>
          new RpcException(new ErrorResponse('Invalid UUID', 400)),
      }),
    )
    doctorGlobalId: string,
  ): Promise<Doctor | null> {
    return await this.authService.getDoctorByGlobalId(doctorGlobalId);
  }

  @MessagePattern({ cmd: AuthPatterns.DOCTOR_UPDATE })
  async doctorUpdate(
    @Payload() updateDoctorInternalDto: UpdateDoctorInternalDto,
  ): Promise<{ message: string }> {
    return await this.authService.updateDoctor(updateDoctorInternalDto);
  }

  @MessagePattern({ cmd: AuthPatterns.DOCTOR_DELETE })
  async deleteDoctor(
    @Payload() globalId: string,
  ): Promise<{ message: string }> {
    return await this.authService.deleteDoctor(globalId);
  }

  @MessagePattern({ cmd: AuthPatterns.DOCTOR_RESTORE })
  async restoreDoctor(
    @Payload() globalId: string,
  ): Promise<{ message: string }> {
    return await this.authService.restoreDoctor(globalId);
  }

  @MessagePattern({ cmd: AuthPatterns.GET_CLINICAL_STAFF_BY_USER_ID })
  async getClinicalStaffByUserId(
    @Payload(
      new ParseIntPipe({
        exceptionFactory: () =>
          new RpcException(new ErrorResponse('Invalid id', 400)),
      }),
    )
    clinicalStaffUserId: number,
  ): Promise<Doctor | SuperAdmin | null> {
    return await this.authService.getClinicalStaffByUserId(clinicalStaffUserId);
  }

  @MessagePattern({ cmd: AuthPatterns.GET_CLINIC_DOCTORS })
  async getClinicDoctors(
    @Payload()
    clinicInternalPaginationRequestDto: ClinicInternalPaginationRequestDto,
  ): Promise<PaginationResponse<Doctor>> {
    return await this.authService.getClinicDoctors(
      clinicInternalPaginationRequestDto,
    );
  }
}
