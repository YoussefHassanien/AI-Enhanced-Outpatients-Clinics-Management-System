import { ErrorResponse, Gender, Role } from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Algorithm } from 'jsonwebtoken';
import { EntityManager, Repository } from 'typeorm';
import { CreateUserDto, JwtPayload } from './constants';
import {
  CreateAdminDto,
  CreateDoctorDto,
  CreatePatientDto,
  CredentialsResponseDto,
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
  private readonly logger: Logger;
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
    this.logger = new Logger(AuthService.name);
  }

  private extractBirthDateFromSocialSecurityNumber = (
    socialSecurityNumber: string,
  ): Date | null => {
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
  };

  private generateAccessToken = async (
    payload: JwtPayload,
  ): Promise<string> => {
    const token = await this.jwtService.signAsync<JwtPayload>(payload, {
      algorithm: this.hashingAlgorithm,
      secret: this.accessTokenSecret,
      expiresIn: this.accessTokenExpirationTime,
      issuer: this.issuer,
      audience: this.audience,
    });

    this.logger.log('Successfully generated an access token');
    return token;
  };

  private createUser = async (
    userDto: CreateUserDto,
    role: Role,
    manager: EntityManager,
  ): Promise<User | null> => {
    const genderIndex: number = parseInt(userDto.socialSecurityNumber[12]);
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
    this.logger.log('Successfully created a user');

    const savedUser = await userRepository.save(createdUser);
    this.logger.log('Successfully saved a user');

    return savedUser;
  };

  private checkExistingUser = async (
    socialSecurityNumber: string,
  ): Promise<User | null> => {
    const user = await this.userRepository.findOneBy({
      socialSecurityNumber: BigInt(socialSecurityNumber),
    });

    if (!user) {
      this.logger.log('User does not exist');
      return null;
    }

    this.logger.log('User already exists');
    return user;
  };

  private checkExistingDoctor = async (
    email: string,
    phone: string,
  ): Promise<Doctor | null> => {
    email = email.trim().toLocaleLowerCase();

    const doctor = await this.doctorRepository.findOne({
      where: [{ email }, { phone }],
    });

    if (!doctor) {
      this.logger.log('Doctor does not exist');
      return null;
    }

    this.logger.log('Doctor already exists');
    return doctor;
  };

  private checkExistingAdmin = async (
    email: string,
    phone: string,
  ): Promise<Admin | null> => {
    email = email.trim().toLocaleLowerCase();

    const admin = await this.adminRepository.findOne({
      where: [{ email }, { phone }],
    });

    if (!admin) {
      this.logger.log('Admin does not exist');
      return null;
    }

    this.logger.log('Admin already exists');
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
      this.logger.log('Validated an admin');

      const adminUser = await this.userRepository.findOneBy({
        id: admin.userId,
      });

      if (!adminUser) {
        this.logger.log('Admin user not found');
      } else {
        this.logger.log('Admin user found');
      }

      return adminUser;
    }

    const doctor = await this.doctorRepository.findOneBy({ email });
    if (doctor && (await bcrypt.compare(password, doctor.password))) {
      this.logger.log('Validated a doctor');

      const doctorUser = await this.userRepository.findOneBy({
        id: doctor.userId,
      });

      if (!doctorUser) {
        this.logger.log('Doctor user not found');
      } else {
        this.logger.log('Doctor user found');
      }

      return doctorUser;
    }

    this.logger.log('User is not validated');
    return null;
  };

  getUser = async (id: number): Promise<User | null> => {
    return await this.userRepository.findOneBy({
      id,
    });
  };

  generateCredentials = async (user: User): Promise<CredentialsResponseDto> => {
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
  };

  createDoctor = async (doctorDto: CreateDoctorDto): Promise<Doctor> => {
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

        const createdDoctor = doctorRepository.create({
          userId: createdUser.id,
          email: doctorDto.email.trim().toLocaleLowerCase(),
          password: hashedPassword,
          speciality: doctorDto.speciality,
          phone: doctorDto.phone,
        });
        this.logger.log('Successfully created a doctor');

        const savedDoctor = await doctorRepository.save(createdDoctor);
        this.logger.log('Successfully saved a doctor');

        return savedDoctor;
      },
    );
  };

  createAdmin = async (adminDto: CreateAdminDto): Promise<Admin> => {
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

        const createdAdmin = adminRepository.create({
          userId: createdUser.id,
          email: adminDto.email.trim().toLocaleLowerCase(),
          password: hashedPassword,
          phone: adminDto.phone,
        });
        this.logger.log('Successfully created an admin');

        const savedAdmin = await adminRepository.save(createdAdmin);
        this.logger.log('Successfully saved an admin');

        return savedAdmin;
      },
    );
  };

  createPatient = async (patientDto: CreatePatientDto): Promise<Patient> => {
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

        const createdPatient = patientRepository.create({
          userId: createdUser.id,
          job: patientDto.job ?? null,
          address: patientDto.address ?? null,
        });
        this.logger.log('Successfully created a patient');

        const savedPatient = await patientRepository.save(createdPatient);
        this.logger.log('Successfully saved a patient');

        return savedPatient;
      },
    );
  };
}
