import {
  AdminPatterns,
  CommonServices,
  ErrorResponse,
  Gender,
  Language,
  LoggingService,
  Microservices,
  PaginationRequest,
  PaginationResponse,
  Role,
} from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Algorithm } from 'jsonwebtoken';
import { lastValueFrom } from 'rxjs';
import { EntityManager, IsNull, Not, Repository } from 'typeorm';
import { Clinic } from '../../admin/src/entities';
import { JwtPayload } from './constants';
import {
  CreateAdminDto,
  CreateDoctorInternalDto,
  CreatePatientDto,
  CreateUserDto,
  CredentialsResponseDto,
  LoginDto,
} from './dtos';
import { UpdatePatientInternalDto } from './dtos/update-patient-internal.dto';
import { Admin, Doctor, Patient, User } from './entities';

@Injectable()
export class AuthService {
  private readonly hashingAlgorithm: Algorithm;
  private readonly rounds: number;
  private readonly accessTokenSecret: string;
  private readonly accessTokenExpirationTime: number;
  private readonly issuer: string;
  private readonly audience: string;
  private readonly logger: LoggingService;
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @Inject(CommonServices.LOGGING) logger: LoggingService,
    @Inject(Microservices.ADMIN) private readonly adminClient: ClientProxy,
  ) {
    this.hashingAlgorithm =
      this.configService.getOrThrow<Algorithm>('HASHING_ALGORITHM');
    this.rounds = this.configService.getOrThrow<number>('ROUNDS');
    this.accessTokenSecret = this.configService.getOrThrow<string>(
      'ACCESS_TOKEN_SECRET',
    );
    this.accessTokenExpirationTime = this.configService.getOrThrow<number>(
      'ACCESS_TOKEN_EXPIRATION_TIME',
    );
    this.issuer = this.configService.getOrThrow<string>('ISSUER');
    this.audience = this.configService.getOrThrow<string>('AUDIENCE');
    this.logger = logger;
  }

  private async validateUser(
    email: string,
    password: string,
  ): Promise<User | null> {
    email = email.trim().toLowerCase();

    const doctor = await this.doctorRepository.findOne({
      relations: { user: true },
      where: {
        email,
        deletedAt: IsNull(),
        isApproved: true,
        user: Not(IsNull()),
      },
    });

    if (doctor && (await bcrypt.compare(password, doctor.password))) {
      this.logger.log('Validated a doctor');

      return doctor.user;
    }

    const admin = await this.adminRepository.findOne({
      relations: { user: true },
      where: {
        email,
        deletedAt: IsNull(),
        user: Not(IsNull()),
      },
    });

    if (admin && (await bcrypt.compare(password, admin.password))) {
      this.logger.log('Validated an admin');

      return admin.user;
    }

    this.logger.log('User is not validated');
    return null;
  }

  private async generateCredentials(
    user: User,
  ): Promise<CredentialsResponseDto> {
    const token = await this.generateAccessToken({
      socialSecurityNumber: String(user.socialSecurityNumber),
      globalId: user.globalId,
      sub: user.id,
      role: user.role,
    });

    return new CredentialsResponseDto(
      `${user.firstName} ${user.lastName}`,
      user.language,
      token,
    );
  }

  private extractBirthDateFromSocialSecurityNumber(
    socialSecurityNumber: string,
  ): Date | null {
    if (socialSecurityNumber.length !== 7) {
      this.logger.log(
        'Birthdate extraction from social security number failed, passed number length is not 7',
      );
      return null;
    }

    const centuryDigit = socialSecurityNumber[0];
    let baseYear = 0;

    if (centuryDigit === '2') {
      baseYear = 1900;
    } else if (centuryDigit === '3') {
      baseYear = 2000;
    } else {
      this.logger.log(
        'Birthdate extraction from social security number failed, century digit is neither 2 nor 3',
      );
      return null;
    }

    const yy = socialSecurityNumber.substring(1, 3);
    const mm = socialSecurityNumber.substring(3, 5);
    const dd = socialSecurityNumber.substring(5, 7);

    const fullYear = baseYear + parseInt(yy);

    this.logger.log(
      'Successfully extracted birthdate from social security number',
    );
    return new Date(`${fullYear}-${mm}-${dd}`);
  }

  private async generateAccessToken(payload: JwtPayload): Promise<string> {
    const token = await this.jwtService.signAsync<JwtPayload>(payload, {
      algorithm: this.hashingAlgorithm,
      secret: this.accessTokenSecret,
      expiresIn: this.accessTokenExpirationTime,
      issuer: this.issuer,
      audience: this.audience,
    });

    this.logger.log('Successfully generated an access token');
    return token;
  }

  private async createUser(
    userDto: CreateUserDto,
    role: Role,
    manager: EntityManager,
  ): Promise<User | null> {
    const genderIndex: number = parseInt(userDto.socialSecurityNumber[12]);
    const gender: Gender = genderIndex % 2 == 0 ? Gender.FEMALE : Gender.MALE;

    const birthDateIndices = userDto.socialSecurityNumber.substring(0, 7);
    const dateOfBirth =
      this.extractBirthDateFromSocialSecurityNumber(birthDateIndices);

    if (!dateOfBirth) {
      return null;
    }

    const userRepository = manager.getRepository(User);

    const user = userRepository.create({
      firstName: userDto.firstName,
      lastName: userDto.lastName,
      role,
      language: userDto.language,
      socialSecurityNumber: BigInt(userDto.socialSecurityNumber),
      gender,
      dateOfBirth,
    });
    this.logger.log('Successfully created a user');

    await userRepository.insert(user);
    this.logger.log('Successfully inserted a user');

    return user;
  }

  private async checkExistingUser(
    socialSecurityNumber: string,
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: {
        socialSecurityNumber: BigInt(socialSecurityNumber),
        deletedAt: IsNull(),
      },
    });

    if (!user) {
      this.logger.log('User does not exist');
      return null;
    }

    this.logger.log('User already exists');
    return user;
  }

  private async checkExistingDoctor(
    email: string,
    phone: string,
  ): Promise<Doctor | null> {
    email = email.trim().toLowerCase();

    const doctor = await this.doctorRepository.findOne({
      where: [
        { email, deletedAt: IsNull(), isApproved: true },
        { phone, deletedAt: IsNull(), isApproved: true },
      ],
    });

    if (!doctor) {
      this.logger.log('Doctor does not exist');
      return null;
    }

    this.logger.log('Doctor already exists');
    return doctor;
  }

  private async checkExistingAdmin(
    email: string,
    phone: string,
  ): Promise<Admin | null> {
    email = email.trim().toLowerCase();

    const admin = await this.adminRepository.findOne({
      where: [
        { email, deletedAt: IsNull() },
        { phone, deletedAt: IsNull() },
      ],
    });

    if (!admin) {
      this.logger.log('Admin does not exist');
      return null;
    }

    this.logger.log('Admin already exists');
    return admin;
  }

  private validateSocialSecurityNumber(socialSecurityNumber: string): void {
    const regex = /^[23]\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{7}$/;
    if (!regex.test(socialSecurityNumber)) {
      throw new RpcException(
        new ErrorResponse('Invalid social security number format', 400),
      );
    }
  }

  isUp(): string {
    return 'Auth service is up';
  }

  async login(loginDto: LoginDto): Promise<{
    role: Role;
    name: string;
    language: Language;
    token: string;
  }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new RpcException(new ErrorResponse('Invalid credentials', 401));
    }

    const credentials = await this.generateCredentials(user);

    return {
      ...credentials,
      role: user.role,
    };
  }

  async getUser(id: number): Promise<User | null> {
    return await this.userRepository.findOne({
      select: { createdAt: false, updatedAt: false, deletedAt: false },
      where: {
        id,
        deletedAt: IsNull(),
      },
    });
  }

  async getDoctorByUserId(userId: number): Promise<Doctor | null> {
    return await this.doctorRepository.findOne({
      relations: { user: true },
      select: {
        createdAt: false,
        updatedAt: false,
        deletedAt: false,
        password: false,
        isApproved: false,
        user: { id: true },
      },
      where: {
        user: { id: userId },
        deletedAt: IsNull(),
        isApproved: true,
      },
    });
  }

  async getPatientByGlobalId(globalId: string): Promise<Patient | null> {
    return await this.patientRepository.findOne({
      select: {
        createdAt: false,
        updatedAt: false,
        deletedAt: false,
      },
      where: {
        globalId,
        deletedAt: IsNull(),
      },
    });
  }

  async getAdminByUserId(userId: number): Promise<Admin | null> {
    return await this.adminRepository.findOne({
      relations: { user: true },
      select: {
        createdAt: false,
        updatedAt: false,
        deletedAt: false,
        password: false,
        user: { id: true },
      },
      where: {
        user: { id: userId },
        deletedAt: IsNull(),
      },
    });
  }

  async createDoctor(
    doctorDto: CreateDoctorInternalDto,
  ): Promise<{ globalId: string; isApproved: boolean }> {
    const existingUser = await this.checkExistingUser(
      doctorDto.socialSecurityNumber,
    );

    if (existingUser) {
      throw new RpcException(new ErrorResponse('User already exists!', 400));
    }

    const existingDoctor = await this.checkExistingDoctor(
      doctorDto.email,
      doctorDto.phone,
    );

    if (existingDoctor) {
      throw new RpcException(new ErrorResponse('Doctor already exists!', 400));
    }

    const clinic = await lastValueFrom<Clinic | null>(
      this.adminClient.send(
        { cmd: AdminPatterns.GET_CLINIC_BY_GLOBAL_ID },
        doctorDto.clinicId,
      ),
    );

    if (!clinic) {
      throw new RpcException(new ErrorResponse('Clinic not found!', 404));
    }

    return await this.userRepository.manager.transaction(
      async (manager: EntityManager) => {
        const createdUser = await this.createUser(
          doctorDto,
          Role.DOCTOR,
          manager,
        );

        if (!createdUser) {
          throw new RpcException(
            new ErrorResponse('Failed to create a user!', 500),
          );
        }

        const hashedPassword = await bcrypt.hash(
          doctorDto.password,
          this.rounds,
        );
        this.logger.log("Successfully hashed doctor's password");

        const doctorRepository = manager.getRepository(Doctor);

        const doctor = doctorRepository.create({
          user: createdUser,
          email: doctorDto.email.trim().toLowerCase(),
          password: hashedPassword,
          speciality: doctorDto.speciality,
          phone: doctorDto.phone,
          isApproved: doctorDto.role === Role.SUPER_ADMIN,
          clinicId: clinic.id,
        });
        this.logger.log('Successfully created a doctor');

        await doctorRepository.insert(doctor);
        this.logger.log('Successfully inserted a doctor');

        return { globalId: doctor.globalId, isApproved: doctor.isApproved };
      },
    );
  }

  async createAdmin(adminDto: CreateAdminDto): Promise<string> {
    const existingUser = await this.checkExistingUser(
      adminDto.socialSecurityNumber,
    );

    if (existingUser) {
      throw new RpcException(new ErrorResponse('User already exists!', 400));
    }

    const existingAdmin = await this.checkExistingAdmin(
      adminDto.email,
      adminDto.phone,
    );

    if (existingAdmin) {
      throw new RpcException(new ErrorResponse('Admin already exists!', 400));
    }

    return await this.userRepository.manager.transaction(
      async (manager: EntityManager) => {
        const createdUser = await this.createUser(
          adminDto,
          Role.ADMIN,
          manager,
        );

        if (!createdUser) {
          throw new RpcException(
            new ErrorResponse('Failed to create a user!', 500),
          );
        }

        const hashedPassword = await bcrypt.hash(
          adminDto.password,
          this.rounds,
        );
        this.logger.log("Successfully hashed admin's password");

        const adminRepository = manager.getRepository(Admin);

        const admin = adminRepository.create({
          user: createdUser,
          email: adminDto.email.trim().toLowerCase(),
          password: hashedPassword,
          phone: adminDto.phone,
        });
        this.logger.log('Successfully created an admin');

        await adminRepository.insert(admin);
        this.logger.log('Successfully inserted an admin');

        return admin.globalId;
      },
    );
  }

  async createPatient(patientDto: CreatePatientDto): Promise<string> {
    const existingUser = await this.checkExistingUser(
      patientDto.socialSecurityNumber,
    );

    if (existingUser) {
      throw new RpcException(new ErrorResponse('User already exists!', 400));
    }

    return await this.userRepository.manager.transaction(
      async (manager: EntityManager) => {
        const createdUser = await this.createUser(
          patientDto,
          Role.PATIENT,
          manager,
        );

        if (!createdUser) {
          throw new RpcException(
            new ErrorResponse('Failed to create a user!', 500),
          );
        }

        const patientRepository = manager.getRepository(Patient);

        const patient = patientRepository.create({
          user: createdUser,
          job: patientDto.job ?? null,
          address: patientDto.address ?? null,
        });
        this.logger.log('Successfully created a patient');

        await patientRepository.insert(patient);
        this.logger.log('Successfully inserted a patient');

        return patient.globalId;
      },
    );
  }

  async getAllDoctors(paginationRequest: PaginationRequest): Promise<
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
    const count = await this.doctorRepository.count({
      where: {
        deletedAt: IsNull(),
        user: {
          deletedAt: IsNull(),
        },
      },
      relations: { user: true },
    });
    this.logger.log(`Doctors count is ${count}`);

    const doctors = await this.doctorRepository.find({
      relations: {
        user: true,
      },
      select: {
        user: {
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          socialSecurityNumber: true,
          globalId: true,
          gender: true,
        },
        id: true,
        globalId: true,
        phone: true,
        email: true,
        speciality: true,
        isApproved: true,
      },
      where: {
        deletedAt: IsNull(),
        user: {
          deletedAt: IsNull(),
        },
      },
      skip: (paginationRequest.page - 1) * paginationRequest.limit,
      take: paginationRequest.limit,
    });
    this.logger.log(
      `Successfully retrieved ${paginationRequest.limit} doctors from page: ${paginationRequest.page - 1}`,
    );

    const response: PaginationResponse<{
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
    }> = {
      items: doctors.map((doctor) => ({
        id: doctor.globalId,
        phone: doctor.phone,
        email: doctor.email,
        speciality: doctor.speciality,
        isApproved: doctor.isApproved,
        user: {
          id: doctor.user.globalId,
          firstName: doctor.user.firstName,
          lastName: doctor.user.lastName,
          gender: doctor.user.gender,
          dateOfBirth: doctor.user.dateOfBirth,
          socialSecurityNumber: doctor.user.socialSecurityNumber,
        },
      })),
      page: paginationRequest.page,
      totalItems: count,
      totalPages: Math.ceil(count / paginationRequest.limit),
    };

    return response;
  }

  async getAllPatients(paginationRequest: PaginationRequest): Promise<
    PaginationResponse<{
      id: string;
      address: string;
      job: string;
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
    const count = await this.patientRepository.count({
      where: {
        deletedAt: IsNull(),
        user: {
          deletedAt: IsNull(),
        },
      },
      relations: { user: true },
    });
    this.logger.log(`Patients count is ${count}`);

    const patients = await this.patientRepository.find({
      relations: {
        user: true,
      },
      select: {
        user: {
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          socialSecurityNumber: true,
          globalId: true,
          gender: true,
        },
        id: true,
        globalId: true,
        address: true,
        job: true,
      },
      where: {
        deletedAt: IsNull(),
        user: {
          deletedAt: IsNull(),
        },
      },
      skip: (paginationRequest.page - 1) * paginationRequest.limit,
      take: paginationRequest.limit,
    });
    this.logger.log(
      `Successfully retrieved ${paginationRequest.limit} patients from page: ${paginationRequest.page - 1}`,
    );

    const response: PaginationResponse<{
      id: string;
      address: string;
      job: string;
      user: {
        id: string;
        socialSecurityNumber: bigint;
        gender: Gender;
        firstName: string;
        lastName: string;
        dateOfBirth: Date;
      };
    }> = {
      items: patients.map((patient) => ({
        id: patient.globalId,
        job: patient.job,
        address: patient.address,
        user: {
          id: patient.user.globalId,
          firstName: patient.user.firstName,
          lastName: patient.user.lastName,
          gender: patient.user.gender,
          dateOfBirth: patient.user.dateOfBirth,
          socialSecurityNumber: patient.user.socialSecurityNumber,
        },
      })),
      page: paginationRequest.page,
      totalItems: count,
      totalPages: Math.ceil(count / paginationRequest.limit),
    };

    return response;
  }

  async getPatientById(id: number): Promise<Patient | null> {
    return await this.patientRepository.findOneBy({
      id,
      deletedAt: IsNull(),
    });
  }

  async getDoctorById(id: number): Promise<Doctor | null> {
    return await this.doctorRepository.findOne({
      where: { id, deletedAt: IsNull(), isApproved: true },
      relations: { user: true },
      select: {
        user: { firstName: true, lastName: true, id: true, globalId: true },
      },
    });
  }

  async updatePatient(
    updatePatientInternalDto: UpdatePatientInternalDto,
  ): Promise<{ message: string }> {
    const patient = await this.patientRepository.findOne({
      where: {
        globalId: updatePatientInternalDto.globalId,
        deletedAt: IsNull(),
      },
      relations: {
        user: true,
      },
    });

    if (!patient) {
      throw new RpcException(new ErrorResponse('Patient not found!', 404));
    }

    await this.patientRepository.manager.transaction(
      async (manager: EntityManager) => {
        // Update User fields if provided
        if (
          updatePatientInternalDto.firstName ||
          updatePatientInternalDto.lastName
        ) {
          const userRepository = manager.getRepository(User);
          const userUpdates: Partial<User> = {};

          if (updatePatientInternalDto.firstName) {
            userUpdates.firstName = updatePatientInternalDto.firstName;
          }
          if (updatePatientInternalDto.lastName) {
            userUpdates.lastName = updatePatientInternalDto.lastName;
          }

          await userRepository.update(patient.user.id, userUpdates);
          this.logger.log('Successfully updated user data');
        }

        // Update Patient fields if provided
        if (updatePatientInternalDto.address || updatePatientInternalDto.job) {
          const patientRepository = manager.getRepository(Patient);
          const patientUpdates: Partial<Patient> = {};

          if (updatePatientInternalDto.address) {
            patientUpdates.address = updatePatientInternalDto.address;
          }
          if (updatePatientInternalDto.job) {
            patientUpdates.job = updatePatientInternalDto.job;
          }

          await patientRepository.update(patient.id, patientUpdates);
          this.logger.log('Successfully updated patient data');
        }
      },
    );

    return { message: 'Patient data is successfully updated' };
  }

  async getPatientBySocialSecurityNumber(
    socialSecurityNumber: string,
  ): Promise<Patient | null> {
    this.validateSocialSecurityNumber(socialSecurityNumber);
    return await this.patientRepository.findOne({
      relations: {
        user: true,
      },
      where: {
        user: {
          socialSecurityNumber: BigInt(socialSecurityNumber),
          deletedAt: IsNull(),
        },
        deletedAt: IsNull(),
      },
      select: {
        user: {
          id: true,
          globalId: true,
          firstName: true,
          lastName: true,
          gender: true,
          dateOfBirth: true,
          socialSecurityNumber: true,
        },
        address: true,
        job: true,
        id: true,
        globalId: true,
      },
    });
  }
}
