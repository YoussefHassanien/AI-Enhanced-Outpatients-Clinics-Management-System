/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AuthPatterns,
  CommonServices,
  Gender,
  Language,
  Microservices,
  Role,
} from '@app/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  CreateDoctorInternalDto,
  CreatePatientDto,
  LoginDto,
} from './dtos';
import { Doctor, Patient, SuperAdmin, User } from './entities';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    insert: jest.fn(),
    manager: {
      transaction: jest.fn(),
      getRepository: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn(),
  };

  const mockLoggingService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  const mockAdminClient = {
    send: jest.fn(),
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Patient),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Doctor),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(SuperAdmin),
          useValue: mockRepository,
        },
        {
          provide: CommonServices.LOGGING,
          useValue: mockLoggingService,
        },
        {
          provide: Microservices.SUPER_ADMIN,
          useValue: mockAdminClient,
        },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
    authController = moduleRef.get(AuthController);
  });

  describe(AuthPatterns.IS_UP, () => {
    it('should return the status of the auth service', () => {
      const result = 'Auth service is up';
      jest.spyOn(authService, 'isUp').mockImplementation(() => result);
      expect(authController.isUp()).toBe(result);
    });
  });

  describe(AuthPatterns.LOGIN, () => {
    const loginDto: LoginDto = {
      email: 'test@test.com',
      password: 'password',
    };

    type LoginResponse = {
      role: Role;
      name: string;
      language: Language;
      token: string;
    };

    it('should return login response for DOCTOR', async () => {
      const result: LoginResponse = {
        role: Role.DOCTOR,
        name: 'John Doe',
        language: Language.ENGLISH,
        token: 'doctor-token',
      };
      jest.spyOn(authService, 'login').mockResolvedValue(result);
      expect(await authController.login(loginDto)).toEqual(result);
    });

    it('should return login response for SUPER_ADMIN', async () => {
      const result: LoginResponse = {
        role: Role.SUPER_ADMIN,
        name: 'Super User',
        language: Language.ENGLISH,
        token: 'super-admin-token',
      };
      jest.spyOn(authService, 'login').mockResolvedValue(result);
      expect(await authController.login(loginDto)).toEqual(result);
    });
  });

  describe(AuthPatterns.DOCTOR_CREATE, () => {
    it('should create an approved doctor', async () => {
      const createDoctorInternalDto: CreateDoctorInternalDto = {} as any;
      const serviceResult = { isApproved: true, globalId: 'doctor-uuid' };
      jest.spyOn(authService, 'createDoctor').mockResolvedValue(serviceResult);

      const result = await authController.doctorCreate(createDoctorInternalDto);
      expect(result).toEqual({
        message: 'Doctor is successfully created and approved',
        id: serviceResult.globalId,
      });
    });

    it('should create a doctor waiting for approval', async () => {
      const createDoctorInternalDto: CreateDoctorInternalDto = {} as any;
      const serviceResult = { isApproved: false, globalId: 'doctor-uuid' };
      jest.spyOn(authService, 'createDoctor').mockResolvedValue(serviceResult);

      const result = await authController.doctorCreate(createDoctorInternalDto);
      expect(result).toEqual({
        message: 'Doctor is successfully created, but waiting for approval',
        id: serviceResult.globalId,
      });
    });
  });

  describe(AuthPatterns.PATIENT_CREATE, () => {
    it('should create a patient', async () => {
      const createPatientDto: CreatePatientDto = {} as any;
      const id = 'patient-uuid';
      jest.spyOn(authService, 'createPatient').mockResolvedValue(id);

      const result = await authController.patientCreate(createPatientDto);
      expect(result).toEqual({
        message: 'Patient is successfully created',
        id,
      });
    });
  });

  describe(AuthPatterns.GET_USER, () => {
    const id = 1;
    const baseUser = {
      id,
      globalId: 'user-uuid',
      firstName: 'John',
      lastName: 'Doe',
      role: Role.DOCTOR,
      language: Language.ARABIC,
      socialSecurityNumber: BigInt(12345678912345),
      gender: Gender.FEMALE,
      dateOfBirth: new Date('2000-01-01'),
    } as User;

    it('should return a doctor user', async () => {
      const user = { ...baseUser, role: Role.DOCTOR };
      jest.spyOn(authService, 'getUser').mockResolvedValue(user);
      expect(await authController.getUser(id)).toEqual(user);
    });

    it('should return a super admin user', async () => {
      const user = { ...baseUser, role: Role.SUPER_ADMIN };
      jest.spyOn(authService, 'getUser').mockResolvedValue(user);
      expect(await authController.getUser(id)).toEqual(user);
    });

    it('should return null', async () => {
      jest.spyOn(authService, 'getUser').mockResolvedValue(null);
      expect(await authController.getUser(id)).toBeNull();
    });
  });

  describe(AuthPatterns.GET_DOCTOR_BY_USER_ID, () => {
    const id = 1;
    const doctorId = 2;
    const doctor = {
      id: doctorId,
      globalId: 'doctor-uuid',
      speciality: 'Cardiology',
      phone: '+212345678912',
      email: 'doctor@test.com',
      user: { id } as User,
    } as Doctor;

    it('should return a doctor', async () => {
      jest.spyOn(authService, 'getDoctorByUserId').mockResolvedValue(doctor);
      expect(await authController.getDoctorByUserId(id)).toEqual(doctor);
    });

    it('should return null', async () => {
      jest.spyOn(authService, 'getDoctorByUserId').mockResolvedValue(null);
      expect(await authController.getDoctorByUserId(id)).toBeNull();
    });
  });

  describe(AuthPatterns.GET_PATIENT_BY_GLOBAL_ID, () => {
    const patientId = 2;
    const globalId = 'patient-uuid';
    const patient = {
      id: patientId,
      globalId,
      address: 'Patient address',
      job: 'Patient job',
      user: {
        id: 1,
        globalId: 'user-uuid',
        firstName: 'John',
        lastName: 'Doe',
        socialSecurityNumber: BigInt(12345678912345),
        gender: Gender.MALE,
        dateOfBirth: new Date('1990-01-01'),
      },
    } as Patient;

    it('should return a patient', async () => {
      jest
        .spyOn(authService, 'getPatientByGlobalId')
        .mockResolvedValue(patient);

      expect(await authController.getPatientByGlobalId(globalId)).toEqual(
        patient,
      );
    });

    it('should return null', async () => {
      jest.spyOn(authService, 'getPatientByGlobalId').mockResolvedValue(null);
      expect(await authController.getPatientByGlobalId(globalId)).toBeNull();
    });
  });
});
