import { Gender, Role } from '@app/common';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Algorithm } from 'jsonwebtoken';
import { EntityManager, Repository } from 'typeorm';
import { CreateUserDto, JwtPayload } from './constants';
import {
  CreateAdminDto,
  CreateDoctorDto,
  CreatePatientDto,
  CredentialsResponse,
} from './dto';
import { Admin, Doctor, Patient, User } from './entities';

@Injectable()
export class AuthService {
  private readonly hashingAlgorithm: Algorithm;
  private readonly rounds: number;
  private readonly accessTokenSecret: string;
  private readonly accessTokenExpirationTime: number;
  private readonly issuer: string;
  private readonly audience: string;
  constructor(
    private readonly jwtService: JwtService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly configService: ConfigService,
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
  }

  private extractBirthDateFromSocialSecurityNumber = (
    socialSecurityNumber: string,
  ): Date | null => {
    if (socialSecurityNumber.length !== 7) {
      return null;
    }

    const centuryDigit = socialSecurityNumber[0];
    let baseYear = 0;

    if (centuryDigit === '2') {
      baseYear = 1900;
    } else if (centuryDigit === '3') {
      baseYear = 2000;
    } else {
      return null;
    }

    const yy = socialSecurityNumber.substring(1, 3);
    const mm = socialSecurityNumber.substring(3, 5);
    const dd = socialSecurityNumber.substring(5, 7);

    const fullYear = baseYear + parseInt(yy);

    return new Date(`${fullYear}-${mm}-${dd}`);
  };

  private generateAccessToken = async (
    payload: JwtPayload,
  ): Promise<string> => {
    const accessToken = await this.jwtService.signAsync<JwtPayload>(payload, {
      algorithm: this.hashingAlgorithm,
      secret: this.accessTokenSecret,
      expiresIn: this.accessTokenExpirationTime,
      issuer: this.issuer,
      audience: this.audience,
    });

    return accessToken;
  };

  private createUser = async (
    userDto: CreateUserDto,
    role: Role,
    manager: EntityManager,
  ): Promise<User | null> => {
    const genderIndex: number = parseInt(userDto.socialSecurityNumber[13]);
    const gender: Gender = genderIndex % 2 == 0 ? Gender.FEMALE : Gender.MALE;

    const birthDateIndices = userDto.socialSecurityNumber.substring(0, 7);
    const dateOfBirth =
      this.extractBirthDateFromSocialSecurityNumber(birthDateIndices);

    if (!dateOfBirth) {
      return null;
    }

    const userRepository = manager.getRepository(User);

    const createdUser = userRepository.create({
      firstName: userDto.firstName,
      lastName: userDto.lastName,
      role,
      language: userDto.language,
      socialSecurityNumber: BigInt(userDto.socialSecurityNumber),
      gender,
      dateOfBirth,
    });

    await userRepository.save(createdUser);

    return createdUser;
  };

  private checkExistingUser = async (
    socialSecurityNumber: string,
  ): Promise<User | null> => {
    const user = await this.userRepository.findOneBy({
      socialSecurityNumber: BigInt(socialSecurityNumber),
    });

    if (!user) {
      return null;
    }

    return user;
  };

  private checkExistingDoctor = async (
    email: string,
  ): Promise<Doctor | null> => {
    email = email.trim().toLocaleLowerCase();

    const doctor = await this.doctorRepository.findOneBy({
      email,
    });

    if (!doctor) {
      return null;
    }

    return doctor;
  };

  private checkExistingAdmin = async (email: string): Promise<Admin | null> => {
    email = email.trim().toLocaleLowerCase();

    const admin = await this.adminRepository.findOneBy({
      email,
    });

    if (!admin) {
      return null;
    }

    return admin;
  };

  isUp(): string {
    return 'Auth service is up';
  }

  validateUser = async (
    email: string,
    password: string,
  ): Promise<User | null> => {
    email = email.trim().toLowerCase();

    const admin = await this.adminRepository.findOneBy({ email });
    if (admin && (await bcrypt.compare(password, admin.password))) {
      return this.userRepository.findOneBy({ id: admin.userId });
    }

    const doctor = await this.doctorRepository.findOneBy({ email });
    if (doctor && (await bcrypt.compare(password, doctor.password))) {
      return this.userRepository.findOneBy({ id: doctor.userId });
    }

    return null;
  };

  getUser = async (id: number): Promise<User | null> => {
    return await this.userRepository.findOneBy({
      id,
    });
  };

  generateCredentials = async (user: User): Promise<CredentialsResponse> => {
    const token = await this.generateAccessToken({
      socialSecurityNumber: String(user.socialSecurityNumber),
      globalId: user.globalId,
      sub: user.id,
      role: user.role,
    });

    return new CredentialsResponse(
      `${user.firstName} ${user.lastName}`,
      user.language,
      token,
    );
  };

  createDoctor = async (doctorDto: CreateDoctorDto): Promise<Doctor | null> => {
    const existingUser = await this.checkExistingUser(
      doctorDto.socialSecurityNumber,
    );

    if (existingUser) {
      throw new BadRequestException({ message: 'User already exists' });
    }

    const existingDoctor = await this.checkExistingDoctor(doctorDto.email);

    if (existingDoctor) {
      throw new BadRequestException({ message: 'Doctor already exists' });
    }

    try {
      return await this.userRepository.manager.transaction(
        async (manager: EntityManager) => {
          const createdUser = await this.createUser(
            doctorDto,
            Role.DOCTOR,
            manager,
          );

          if (!createdUser) {
            throw new InternalServerErrorException({
              message: 'Failed to create user',
            });
          }

          const hashedPassword = await bcrypt.hash(
            doctorDto.password,
            this.rounds,
          );

          const doctorRepository = manager.getRepository(Doctor);
          const createdDoctor = doctorRepository.create({
            userId: createdUser.id,
            email: doctorDto.email.trim().toLocaleLowerCase(),
            password: hashedPassword,
            speciality: doctorDto.speciality,
            phone: doctorDto.phone,
          });

          return doctorRepository.save(createdDoctor);
        },
      );
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  createAdmin = async (adminDto: CreateAdminDto): Promise<Admin | null> => {
    const existingUser = await this.checkExistingUser(
      adminDto.socialSecurityNumber,
    );

    if (existingUser) {
      throw new BadRequestException({ message: 'User already exists' });
    }

    const existingAdmin = await this.checkExistingAdmin(adminDto.email);

    if (existingAdmin) {
      throw new BadRequestException({ message: 'Admin already exists' });
    }

    try {
      return await this.userRepository.manager.transaction(
        async (manager: EntityManager) => {
          const createdUser = await this.createUser(
            adminDto,
            Role.ADMIN,
            manager,
          );

          if (!createdUser) {
            throw new InternalServerErrorException({
              message: 'Failed to create user',
            });
          }

          const hashedPassword = await bcrypt.hash(
            adminDto.password,
            this.rounds,
          );

          const adminRepository = manager.getRepository(Admin);
          const createdAdmin = adminRepository.create({
            userId: createdUser.id,
            email: adminDto.email.trim().toLocaleLowerCase(),
            password: hashedPassword,
            phone: adminDto.phone,
          });

          return adminRepository.save(createdAdmin);
        },
      );
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  createPatient = async (
    patientDto: CreatePatientDto,
  ): Promise<Patient | null> => {
    const existingUser = await this.checkExistingUser(
      patientDto.socialSecurityNumber,
    );

    if (existingUser) {
      throw new BadRequestException({ message: 'User already exists' });
    }

    try {
      return await this.userRepository.manager.transaction(
        async (manager: EntityManager) => {
          const createdUser = await this.createUser(
            patientDto,
            Role.PATIENT,
            manager,
          );

          if (!createdUser) {
            throw new InternalServerErrorException({
              message: 'Failed to create user',
            });
          }

          const patientRepository = manager.getRepository(Patient);
          const createdPatient = patientRepository.create({
            userId: createdUser.id,
            job: patientDto.job ?? null,
            address: patientDto.address ?? null,
          });

          return patientRepository.save(createdPatient);
        },
      );
    } catch (error) {
      console.log(error);
      return null;
    }
  };
}
