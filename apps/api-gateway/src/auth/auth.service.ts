import { AuthPatterns, Language, Role, Services } from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';
import { lastValueFrom } from 'rxjs';
import {
  CreateAdminDto,
  CreateDoctorDto,
  CreateDoctorInternalDto,
  CreatePatientDto,
  LoginDto,
} from '../../../auth/src/dtos';
import { User } from '../../../auth/src/entities';

@Injectable()
export class AuthService {
  constructor(
    @Inject(Services.AUTH) private readonly authClient: ClientProxy,
  ) {}

  async isUp(): Promise<string> {
    return await lastValueFrom<string>(
      this.authClient.send({ cmd: AuthPatterns.IS_UP }, {}),
    );
  }

  async login(loginDto: LoginDto): Promise<{
    role: Role;
    name: string;
    language: Language;
    token: string;
  }> {
    return await lastValueFrom<{
      role: Role;
      name: string;
      language: Language;
      token: string;
    }>(this.authClient.send({ cmd: AuthPatterns.LOGIN }, loginDto));
  }

  async createAdmin(createAdminDto: CreateAdminDto): Promise<{
    message: string;
    id: string;
  }> {
    return await lastValueFrom<{
      message: string;
      id: string;
    }>(
      this.authClient.send({ cmd: AuthPatterns.ADMIN_CREATE }, createAdminDto),
    );
  }

  async createDoctor(
    createDoctorDto: CreateDoctorDto,
    req: Request,
  ): Promise<{
    message: string;
    id: string;
  }> {
    const internalDoctorDto = new CreateDoctorInternalDto(
      createDoctorDto,
      (req.user as User).role,
    );

    return await lastValueFrom<{
      message: string;
      id: string;
    }>(
      this.authClient.send(
        { cmd: AuthPatterns.DOCTOR_CREATE },
        internalDoctorDto,
      ),
    );
  }

  async createPatient(createPatientDto: CreatePatientDto): Promise<{
    message: string;
    id: string;
  }> {
    return await lastValueFrom<{
      message: string;
      id: string;
    }>(
      this.authClient.send(
        { cmd: AuthPatterns.PATIENT_CREATE },
        createPatientDto,
      ),
    );
  }

  async getUser(id: number): Promise<User | null> {
    return await lastValueFrom<User | null>(
      this.authClient.send({ cmd: AuthPatterns.GET_USER }, id),
    );
  }
}
