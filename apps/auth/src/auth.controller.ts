import { Controller } from '@nestjs/common';
import { MessagePattern, RpcException } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { AuthPatterns } from './constants';
import {
  CreateAdminDto,
  CreateDoctorDto,
  CreatePatientDto,
  LoginDto,
} from './dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: AuthPatterns.IS_UP })
  isUp(): string {
    return this.authService.isUp();
  }

  @MessagePattern({ cmd: AuthPatterns.LOGIN })
  async login(loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    if (!user) {
      throw new RpcException({ message: 'Invalid credentials' });
    }

    const credentials = await this.authService.generateCredentials(user);

    return {
      ...credentials,
      role: user.role,
    };
  }

  @MessagePattern({ cmd: AuthPatterns.ADMIN_CREATE })
  async adminCreate(createAdminDto: CreateAdminDto) {
    const admin = await this.authService.createAdmin(createAdminDto);

    if (!admin) {
      throw new RpcException({ message: 'Failed to create admin' });
    }

    return { message: 'Admin is successfully created', id: admin.globalId };
  }

  @MessagePattern({ cmd: AuthPatterns.DOCTOR_CREATE })
  async doctorCreate(createDoctorDto: CreateDoctorDto) {
    const doctor = await this.authService.createDoctor(createDoctorDto);

    if (!doctor) {
      throw new RpcException({ message: 'Failed to create doctor' });
    }

    return { message: 'Doctor is successfully created', id: doctor.globalId };
  }

  @MessagePattern({ cmd: AuthPatterns.PATIENT_CREATE })
  async patientCreate(createPatientDto: CreatePatientDto) {
    const patient = await this.authService.createPatient(createPatientDto);

    if (!patient) {
      throw new RpcException({ message: 'Failed to create patient' });
    }

    return { message: 'Patient is successfully created', id: patient.globalId };
  }
}
