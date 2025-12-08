import { Language, Role } from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { AuthPatterns } from '../../../auth/src/constants';
import {
  CreateAdminDto,
  CreateDoctorDto,
  CreatePatientDto,
  LoginDto,
} from '../../../auth/src/dto';
import { User } from '../../../auth/src/entities';
import { Services } from '../constants';

@Injectable()
export class AuthService {
  constructor(
    @Inject(Services.AUTH) private readonly authClient: ClientProxy,
  ) {}

  async isUp() {
    return await lastValueFrom<string>(
      this.authClient.send({ cmd: AuthPatterns.IS_UP }, {}),
    );
  }

  async login(loginDto: LoginDto) {
    return await lastValueFrom<
      Promise<{
        role: Role;
        name: string;
        language: Language;
        token: string;
      }>
    >(this.authClient.send({ cmd: AuthPatterns.LOGIN }, loginDto));
  }

  async createAdmin(createAdminDto: CreateAdminDto) {
    return await lastValueFrom<
      Promise<{
        message: string;
        id: string;
      }>
    >(this.authClient.send({ cmd: AuthPatterns.ADMIN_CREATE }, createAdminDto));
  }

  async createDoctor(createDoctorDto: CreateDoctorDto) {
    return await lastValueFrom<
      Promise<{
        message: string;
        id: string;
      }>
    >(
      this.authClient.send(
        { cmd: AuthPatterns.DOCTOR_CREATE },
        createDoctorDto,
      ),
    );
  }

  async createPatient(createPatientDto: CreatePatientDto) {
    return await lastValueFrom<
      Promise<{
        message: string;
        id: string;
      }>
    >(
      this.authClient.send(
        { cmd: AuthPatterns.PATIENT_CREATE },
        createPatientDto,
      ),
    );
  }

  async getUser(id: number) {
    return await lastValueFrom<Promise<User | null>>(
      this.authClient.send({ cmd: AuthPatterns.GET_USER }, id),
    );
  }
}
