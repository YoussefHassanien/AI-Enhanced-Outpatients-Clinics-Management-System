/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonServices, Language, Role } from '@app/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import {
  CreateAdminDto,
  CreateDoctorInternalDto,
  CreatePatientDto,
  LoginDto,
} from './dtos';
import { Admin, Doctor, Patient, User } from './entities';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let doctorRepository: Repository<Doctor>;
  let adminRepository: Repository<Admin>;
  let patientRepository: Repository<Patient>;
  let jwtService: JwtService;

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      switch (key) {
        case 'HASHING_ALGORITHM':
          return 'HS256';
        case 'ROUNDS':
          return 10;
        case 'ACCESS_TOKEN_SECRET':
          return 'secret';
        case 'ACCESS_TOKEN_EXPIRATION_TIME':
          return 3600;
        case 'ISSUER':
          return 'issuer';
        case 'AUDIENCE':
          return 'audience';
        default:
          return null;
      }
    }),
  };

  const mockLoggingService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  // Mock Repository Factory
  const createMockRepository = () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    insert: jest.fn(),
    manager: {
      transaction: jest.fn(),
      getRepository: jest.fn(),
    },
  });

  // Mock Entity Manager for Transactions
  const mockEntityManager = {
    getRepository: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CommonServices.LOGGING, useValue: mockLoggingService },
        { provide: getRepositoryToken(User), useValue: createMockRepository() },
        {
          provide: getRepositoryToken(Doctor),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Admin),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Patient),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    doctorRepository = module.get(getRepositoryToken(Doctor));
    adminRepository = module.get(getRepositoryToken(Admin));
    patientRepository = module.get(getRepositoryToken(Patient));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isUp', () => {
    it('should return "Auth service is up"', () => {
      expect(service.isUp()).toBe('Auth service is up');
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@test.com',
      password: 'password',
    };

    it('should login a doctor successfully', async () => {
      const user = {
        id: 1,
        role: Role.DOCTOR,
        firstName: 'John',
        lastName: 'Doe',
        language: Language.ENGLISH,
        socialSecurityNumber: BigInt(123),
        globalId: 'uuid',
      } as User;
      const doctor = { password: 'hashedPassword', user } as Doctor;

      jest.spyOn(doctorRepository, 'findOne').mockResolvedValue(doctor);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue('token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        name: 'John Doe',
        language: Language.ENGLISH,
        token: 'token',
        role: Role.DOCTOR,
      });
    });

    it('should login an admin successfully', async () => {
      const user = {
        id: 1,
        role: Role.ADMIN,
        firstName: 'Jane',
        lastName: 'Doe',
        language: Language.ENGLISH,
        socialSecurityNumber: BigInt(123),
        globalId: 'uuid',
      } as User;
      const admin = { password: 'hashedPassword', user } as Admin;

      jest.spyOn(doctorRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(adminRepository, 'findOne').mockResolvedValue(admin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue('token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        name: 'Jane Doe',
        language: Language.ENGLISH,
        token: 'token',
        role: Role.ADMIN,
      });
    });

    it('should throw Invalid credentials if user not found', async () => {
      jest.spyOn(doctorRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(adminRepository, 'findOne').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new RpcException({ message: 'Invalid credentials', statusCode: 401 }),
      );
    });

    it('should throw Invalid credentials if password does not match', async () => {
      const doctor = { password: 'hashedPassword' } as Doctor;
      jest.spyOn(doctorRepository, 'findOne').mockResolvedValue(doctor);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new RpcException({ message: 'Invalid credentials', statusCode: 401 }),
      );
    });
  });

  describe('createAdmin', () => {
    // Valid SSN: Century 3 (2000s), valid length
    const validSSN = '30001011234567';
    const dto: CreateAdminDto = {
      email: 'admin@test.com',
      password: 'pass',
      phone: '123',
      firstName: 'Admin',
      lastName: 'User',
      language: Language.ENGLISH,
      socialSecurityNumber: validSSN,
    };

    it('should create an admin successfully', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null); // User check
      jest.spyOn(adminRepository, 'findOne').mockResolvedValue(null); // Admin check
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      // Mock Transaction
      jest
        .spyOn(userRepository.manager, 'transaction')
        .mockImplementation(async (cb) => {
          return cb(mockEntityManager as any);
        });

      // Mock EntityManager behavior
      mockEntityManager.getRepository.mockImplementation((entity) => {
        if (entity === User) return userRepository;
        if (entity === Admin) return adminRepository;
        return null;
      });

      const createdUser = { id: 1 } as User;
      const createdAdmin = { globalId: 'admin-uuid' } as Admin;

      jest.spyOn(userRepository, 'create').mockReturnValue(createdUser);
      jest.spyOn(userRepository, 'insert').mockResolvedValue(undefined);
      jest.spyOn(adminRepository, 'create').mockReturnValue(createdAdmin);
      jest.spyOn(adminRepository, 'insert').mockResolvedValue(undefined);

      const result = await service.createAdmin(dto);
      expect(result).toBe('admin-uuid');
    });

    it('should throw if user already exists', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({} as User);
      await expect(service.createAdmin(dto)).rejects.toThrow(
        new RpcException({ message: 'User already exists!', statusCode: 400 }),
      );
    });

    it('should throw if admin already exists', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(adminRepository, 'findOne').mockResolvedValue({} as Admin);
      await expect(service.createAdmin(dto)).rejects.toThrow(
        new RpcException({ message: 'Admin already exists!', statusCode: 400 }),
      );
    });
  });

  describe('createDoctor', () => {
    const validSSN = '30001011234567';
    const dto: CreateDoctorInternalDto = {
      email: 'doc@test.com',
      password: 'pass',
      phone: '123',
      firstName: 'Doc',
      lastName: 'User',
      language: Language.ENGLISH,
      socialSecurityNumber: validSSN,
      speciality: 'Cardio',
      role: Role.DOCTOR, // Normal doctor creation
    };

    it('should create a doctor successfully', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(doctorRepository, 'findOne').mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      jest
        .spyOn(userRepository.manager, 'transaction')
        .mockImplementation(async (cb) => {
          return await wcb(mockEntityManager as any);
        });

      mockEntityManager.getRepository.mockImplementation((entity) => {
        if (entity === User) return userRepository;
        if (entity === Doctor) return doctorRepository;
        return null;
      });

      const createdUser = { id: 1 } as User;
      const createdDoctor = {
        globalId: 'doc-uuid',
        isApproved: false,
      } as Doctor;

      jest.spyOn(userRepository, 'create').mockReturnValue(createdUser);
      jest.spyOn(doctorRepository, 'create').mockReturnValue(createdDoctor);

      const result = await service.createDoctor(dto);
      expect(result).toEqual({ globalId: 'doc-uuid', isApproved: false });
    });

    it('should throw if doctor already exists', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(doctorRepository, 'findOne').mockResolvedValue({} as Doctor);
      await expect(service.createDoctor(dto)).rejects.toThrow(
        new RpcException({
          message: 'Doctor already exists!',
          statusCode: 400,
        }),
      );
    });
  });

  describe('createPatient', () => {
    const validSSN = '30001011234567';
    const dto: CreatePatientDto = {
      firstName: 'Pat',
      lastName: 'User',
      language: Language.ENGLISH,
      socialSecurityNumber: validSSN,
      address: 'Address',
      job: 'Job',
    };

    it('should create a patient successfully', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      jest
        .spyOn(userRepository.manager, 'transaction')
        .mockImplementation(async (cb) => {
          return await cb(mockEntityManager as any);
        });

      mockEntityManager.getRepository.mockImplementation((entity) => {
        if (entity === User) return userRepository;
        if (entity === Patient) return patientRepository;
        return null;
      });

      const createdUser = { id: 1 } as User;
      const createdPatient = { globalId: 'pat-uuid' } as Patient;

      jest.spyOn(userRepository, 'create').mockReturnValue(createdUser);
      jest.spyOn(patientRepository, 'create').mockReturnValue(createdPatient);

      const result = await service.createPatient(dto);
      expect(result).toBe('pat-uuid');
    });
  });

  describe('Getters', () => {
    it('getUser should return user', async () => {
      const user = { id: 1 } as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      expect(await service.getUser(1)).toEqual(user);
    });

    it('getDoctorByUserId should return doctor', async () => {
      const doctor = { id: 1 } as Doctor;
      jest.spyOn(doctorRepository, 'findOne').mockResolvedValue(doctor);
      expect(await service.getDoctorByUserId(1)).toEqual(doctor);
    });

    it('getPatientByGlobalId should return patient', async () => {
      const patient = { id: 1 } as Patient;
      jest.spyOn(patientRepository, 'findOne').mockResolvedValue(patient);
      expect(await service.getPatientByGlobalId('uuid')).toEqual(patient);
    });

    it('getAdminByUserId should return admin', async () => {
      const admin = { id: 1 } as Admin;
      jest.spyOn(adminRepository, 'findOne').mockResolvedValue(admin);
      expect(await service.getAdminByUserId(1)).toEqual(admin);
    });
  });
});
