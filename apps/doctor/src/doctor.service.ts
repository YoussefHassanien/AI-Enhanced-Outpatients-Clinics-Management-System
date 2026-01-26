import {
  AdminPatterns,
  AuthPatterns,
  CloudStoragePatterns,
  CommonServices,
  ErrorResponse,
  Gender,
  LoggingService,
  Microservices,
  PaginationRequest,
  PaginationResponse,
} from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { lastValueFrom } from 'rxjs';
import { IsNull, Repository } from 'typeorm';
import { Clinic } from '../../admin/src/entities';
import { Doctor, Patient } from '../../auth/src/entities';
import {
  LabPhotoInternalDto,
  ScanPhotoInternalDto,
} from '../../cloud-storage/src/dtos';
import { MedicationDosage, MedicationPeriod, ScanTypes } from './constants';
import {
  CreateMedicationInternalDto,
  CreateVisitInternalDto,
  GetDoctorPatientsDto,
  GetDoctorVisitsDto,
  UploadLabInternalDto,
  UploadScanPhotoInternalDto,
} from './dtos';
import { Lab, Medication, Scan, Visit } from './entities';

@Injectable()
export class DoctorService {
  private readonly logger: LoggingService;
  constructor(
    @InjectRepository(Lab)
    private readonly labsRepository: Repository<Lab>,
    @InjectRepository(Visit)
    private readonly visitsRepository: Repository<Visit>,
    @InjectRepository(Medication)
    private readonly medicationsRepository: Repository<Medication>,
    @InjectRepository(Scan)
    private readonly scansRepository: Repository<Scan>,
    @Inject(Microservices.AUTH) private readonly authClient: ClientProxy,
    @Inject(Microservices.ADMIN) private readonly adminClient: ClientProxy,
    @Inject(Microservices.CLOUD_STORAGE)
    private readonly cloudStorageClient: ClientProxy,
    @Inject(CommonServices.LOGGING) logger: LoggingService,
  ) {
    this.logger = logger;
  }

  private async getDoctorByUserId(
    doctorUserId: number,
  ): Promise<Doctor | null> {
    const doctor = await lastValueFrom<Doctor | null>(
      this.authClient.send(
        { cmd: AuthPatterns.GET_DOCTOR_BY_USER_ID },
        doctorUserId,
      ),
    );

    if (!doctor) {
      this.logger.log('Doctor not found');
      return null;
    }

    this.logger.log('Doctor is found');
    return doctor;
  }

  private async getPatientByGlobalId(
    patientGlobalId: string,
  ): Promise<Patient | null> {
    const patient = await lastValueFrom<Patient | null>(
      this.authClient.send(
        { cmd: AuthPatterns.GET_PATIENT_BY_GLOBAL_ID },
        patientGlobalId,
      ),
    );

    if (!patient) {
      this.logger.log('Patient not found');
      return null;
    }

    this.logger.log('Patient is found');
    return patient;
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
    return 'Doctor service is up';
  }

  async createVisit(
    createVisitInternalDto: CreateVisitInternalDto,
  ): Promise<void> {
    const doctor = await this.getDoctorByUserId(
      createVisitInternalDto.doctorUserId,
    );

    if (!doctor) {
      throw new RpcException(new ErrorResponse('Doctor not found!', 404));
    }

    const patient = await this.getPatientByGlobalId(
      createVisitInternalDto.patientId,
    );

    if (!patient) {
      throw new RpcException(new ErrorResponse('Patient not found!', 404));
    }

    const clinic = await lastValueFrom<Clinic | null>(
      this.adminClient.send(
        { cmd: AdminPatterns.GET_CLINIC_BY_ID },
        doctor.clinicId,
      ),
    );

    if (!clinic) {
      throw new RpcException(new ErrorResponse('Clinic not found!', 404));
    }

    const visit = this.visitsRepository.create({
      diagnoses: createVisitInternalDto.diagnoses,
      patientId: patient.id,
      doctorId: doctor.id,
      clinicId: doctor.clinicId,
    });
    this.logger.log('Successfully created visit');

    await this.visitsRepository.insert(visit);
    this.logger.log('Successfully inserted visit');
  }

  async createMedication(
    createMedicationInternalDto: CreateMedicationInternalDto,
  ): Promise<void> {
    const doctor = await this.getDoctorByUserId(
      createMedicationInternalDto.doctorUserId,
    );

    if (!doctor) {
      throw new RpcException(new ErrorResponse('Doctor not found!', 404));
    }

    const patient = await this.getPatientByGlobalId(
      createMedicationInternalDto.patientId,
    );

    if (!patient) {
      throw new RpcException(new ErrorResponse('Patient not found!', 404));
    }

    const medication = this.medicationsRepository.create({
      name: createMedicationInternalDto.name,
      dosage: createMedicationInternalDto.dosage,
      period: createMedicationInternalDto.period,
      comments: createMedicationInternalDto.comments,
      patientId: patient.id,
      doctorId: doctor.id,
    });
    this.logger.log('Successfully created medication');

    await this.medicationsRepository.insert(medication);
    this.logger.log('Successfully inserted medication');
  }

  async getAllVisits(paginationRequest: PaginationRequest): Promise<
    PaginationResponse<{
      id: string;
      diagnoses: string;
      patientId: string;
      doctorId: string;
      createdAt: Date;
    }>
  > {
    const count = await this.visitsRepository.count({
      where: {
        deletedAt: IsNull(),
      },
    });
    this.logger.log(`Visits count is ${count}`);

    const visits = await this.visitsRepository.find({
      select: {
        globalId: true,
        diagnoses: true,
        patientId: true,
        doctorId: true,
        createdAt: true,
      },
      where: {
        deletedAt: IsNull(),
      },
      skip: (paginationRequest.page - 1) * paginationRequest.limit,
      take: paginationRequest.limit,
    });
    this.logger.log(
      `Successfully retrieved ${paginationRequest.limit} visits from page: ${paginationRequest.page - 1}`,
    );

    // Fetch patient and doctor global IDs via RPC
    const items = await Promise.all(
      visits.map(async (visit) => {
        const [patient, doctor] = await Promise.all([
          lastValueFrom<Patient | null>(
            this.authClient.send(
              { cmd: AuthPatterns.GET_PATIENT_BY_ID },
              visit.patientId,
            ),
          ),
          lastValueFrom<Doctor | null>(
            this.authClient.send(
              { cmd: AuthPatterns.GET_DOCTOR_BY_ID },
              visit.doctorId,
            ),
          ),
        ]);

        return {
          id: visit.globalId,
          diagnoses: visit.diagnoses,
          patientId: patient?.globalId ?? 'UNKNOWN',
          doctorId: doctor?.globalId ?? 'UNKNOWN',
          createdAt: visit.createdAt,
        };
      }),
    );

    const response: PaginationResponse<{
      id: string;
      diagnoses: string;
      patientId: string;
      doctorId: string;
      createdAt: Date;
    }> = {
      page: paginationRequest.page,
      items,
      totalItems: count,
      totalPages: Math.ceil(count / paginationRequest.limit),
    };

    return response;
  }

  async getDoctorPatients(getDoctorPatientsDto: GetDoctorPatientsDto): Promise<{
    page: number;
    items: {
      id: string;
      name: string;
      gender: Gender;
      dateOfBirth: Date;
      socialSecurityNumber: string;
      address: string;
      job: string;
    }[];
    totalItems: number;
    totalPages: number;
  }> {
    const doctor = await this.getDoctorByUserId(
      getDoctorPatientsDto.doctorUserId,
    );

    if (!doctor) {
      throw new RpcException(new ErrorResponse('Doctor not found!', 404));
    }

    const page = getDoctorPatientsDto.page || 1;
    const limit = getDoctorPatientsDto.limit || 10;

    const visits = await this.visitsRepository.find({
      where: {
        doctorId: doctor.id,
        deletedAt: IsNull(),
      },
      select: {
        patientId: true,
      },
    });
    const patientIds = [...new Set(visits.map((visit) => visit.patientId))];
    const totalItems = patientIds.length;
    this.logger.log(`Found ${totalItems} unique patients for the doctor`);

    const skip = (page - 1) * limit;
    const paginatedPatientIds = patientIds.slice(skip, skip + limit);

    const patients = await Promise.all(
      paginatedPatientIds.map(async (patientId) => {
        const patient = await lastValueFrom<Patient | null>(
          this.authClient.send(
            { cmd: AuthPatterns.GET_PATIENT_BY_ID },
            patientId,
          ),
        );

        if (!patient) {
          this.logger.log(`Patient with ID ${patientId} not found`);
          return null;
        }

        return {
          id: patient.globalId,
          name: `${patient.user.firstName} ${patient.user.lastName}`,
          gender: patient.user.gender,
          dateOfBirth: patient.user.dateOfBirth,
          socialSecurityNumber: patient.user.socialSecurityNumber.toString(),
          address: patient.address,
          job: patient.job,
        };
      }),
    );

    const items = patients.filter((p) => p !== null);
    this.logger.log(
      `Successfully retrieved ${items.length} patients for page ${page}`,
    );

    return {
      page,
      items,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    };
  }

  async getDoctorVisits(getDoctorVisitsDto: GetDoctorVisitsDto): Promise<{
    page: number;
    items: {
      id: string;
      diagnoses: string;
      patient: {
        name: string;
        id: string;
      };
      doctor: {
        name: string;
        id: string;
      };
      createdAt: Date;
    }[];
    totalItems: number;
    totalPages: number;
  }> {
    const doctor = await this.getDoctorByUserId(
      getDoctorVisitsDto.doctorUserId,
    );

    if (!doctor) {
      throw new RpcException(new ErrorResponse('Doctor not found!', 404));
    }

    const page = getDoctorVisitsDto.page || 1;
    const limit = getDoctorVisitsDto.limit || 10;
    const skip = (page - 1) * limit;

    const [visits, totalItems] = await this.visitsRepository.findAndCount({
      where: {
        doctorId: doctor.id,
        deletedAt: IsNull(),
      },
      order: {
        createdAt: 'DESC',
      },
      skip,
      take: limit,
    });

    this.logger.log(
      `Found ${visits.length} visits for doctor ${doctor.globalId}`,
    );

    // Extract unique patient IDs and fetch all patients in parallel
    const patientIds = [...new Set(visits.map((v) => v.patientId))];
    const patients = await Promise.all(
      patientIds.map((id) =>
        lastValueFrom<Patient | null>(
          this.authClient.send({ cmd: AuthPatterns.GET_PATIENT_BY_ID }, id),
        ),
      ),
    );

    // Create patient lookup map
    const patientsMap = new Map(
      patients.map((patient, index) => [
        patientIds[index],
        patient
          ? {
              name: `${patient.user.firstName} ${patient.user.lastName}`,
              id: patient.globalId,
            }
          : { name: 'UNKNOWN', id: 'UNKNOWN' },
      ]),
    );

    // Reuse the doctor info we already fetched
    const doctorInfo = {
      name: `${doctor.user.firstName} ${doctor.user.lastName}`,
      id: doctor.globalId,
    };

    // Map visits using the lookup map
    const visitsInformation = visits.map((visit) => ({
      id: visit.globalId,
      diagnoses: visit.diagnoses,
      patient: patientsMap.get(visit.patientId) ?? {
        name: 'UNKNOWN',
        id: 'UNKNOWN',
      },
      doctor: doctorInfo,
      createdAt: visit.createdAt,
    }));

    this.logger.log(
      `Successfully retrieved ${visitsInformation.length} visits with info`,
    );

    return {
      page,
      items: visitsInformation,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    };
  }

  async getPatientVisits(socialSecurityNumber: string): Promise<{
    patient: {
      id: string;
      name: string;
      gender: Gender;
      dateOfBirth: Date;
      socialSecurityNumber: string;
      address: string;
      job: string;
    };
    clinics: {
      id: string;
      name: string;
      visits: {
        doctor: {
          name: string;
          speciality: string;
        };
        diagnoses: string;
        createdAt: Date;
      }[];
    }[];
  }> {
    this.validateSocialSecurityNumber(socialSecurityNumber);

    const patient = await lastValueFrom<Patient | null>(
      this.authClient.send(
        { cmd: AuthPatterns.GET_PATIENT_BY_SOCIAL_SECURITY_NUMBER },
        socialSecurityNumber,
      ),
    );

    if (!patient) {
      throw new RpcException(new ErrorResponse('Patient not found!', 404));
    }

    // Fetch clinics and visits in parallel
    const [clinics, patientVisits] = await Promise.all([
      lastValueFrom<Clinic[]>(
        this.adminClient.send(
          { cmd: AdminPatterns.GET_ALL_CLINICS_WITH_ID },
          {},
        ),
      ),
      this.visitsRepository.find({
        where: {
          patientId: patient.id,
          deletedAt: IsNull(),
        },
        order: {
          createdAt: 'DESC',
        },
      }),
    ]);

    // Extract unique doctor IDs
    const doctorsIds = [...new Set(patientVisits.map((v) => v.doctorId))];

    // Fetch all doctors in parallel (batch request)
    const doctors = await Promise.all(
      doctorsIds.map((id) =>
        lastValueFrom<Doctor | null>(
          this.authClient.send({ cmd: AuthPatterns.GET_DOCTOR_BY_ID }, id),
        ),
      ),
    );

    // Create lookup maps
    const doctorsMap = new Map(
      doctors.map((doctor, index) => [
        doctorsIds[index],
        doctor
          ? {
              name: `${doctor.user.firstName} ${doctor.user.lastName}`,
              speciality: doctor.speciality,
            }
          : { name: 'UNKNOWN', speciality: 'UNKNOWN' },
      ]),
    );

    const clinicsMap = new Map(
      clinics.map((clinic) => [
        clinic.id,
        {
          id: clinic.globalId,
          name: clinic.name,
        },
      ]),
    );

    // Build patient object
    const patientInfo = {
      id: patient.globalId,
      name: `${patient.user.firstName} ${patient.user.lastName}`,
      gender: patient.user.gender,
      dateOfBirth: patient.user.dateOfBirth,
      socialSecurityNumber: patient.user.socialSecurityNumber.toString(),
      address: patient.address,
      job: patient.job,
    };

    // Group visits by clinic
    const visitsByClinic = patientVisits.reduce<
      Record<
        number,
        {
          id: string;
          name: string;
          visits: {
            doctor: {
              name: string;
              speciality: string;
            };
            diagnoses: string;
            createdAt: Date;
          }[];
        }
      >
    >((acc, visit) => {
      const clinic = clinicsMap.get(visit.clinicId);
      if (!clinic) return acc;

      const doctor = doctorsMap.get(visit.doctorId);

      if (!acc[visit.clinicId]) {
        acc[visit.clinicId] = {
          id: clinic.id,
          name: clinic.name,
          visits: [],
        };
      }

      acc[visit.clinicId].visits.push({
        doctor: {
          name: doctor?.name ?? 'UNKNOWN',
          speciality: doctor?.speciality ?? 'UNKNOWN',
        },
        diagnoses: visit.diagnoses,
        createdAt: visit.createdAt,
      });

      return acc;
    }, {});

    return { patient: patientInfo, clinics: Object.values(visitsByClinic) };
  }

  async getPatientMedications(socialSecurityNumber: string): Promise<{
    patient: {
      id: string;
      name: string;
      gender: Gender;
      dateOfBirth: Date;
      socialSecurityNumber: string;
      address: string;
      job: string;
    };
    medications: {
      name: string;
      dosage: MedicationDosage;
      period: MedicationPeriod;
      comments: string;
      doctor: {
        name: string;
        speciality: string;
      };
      createdAt: Date;
    }[];
  }> {
    this.validateSocialSecurityNumber(socialSecurityNumber);

    const patient = await lastValueFrom<Patient | null>(
      this.authClient.send(
        { cmd: AuthPatterns.GET_PATIENT_BY_SOCIAL_SECURITY_NUMBER },
        socialSecurityNumber,
      ),
    );

    if (!patient) {
      throw new RpcException(new ErrorResponse('Patient not found!', 404));
    }

    const patientMedications = await this.medicationsRepository.find({
      where: {
        patientId: patient.id,
        deletedAt: IsNull(),
      },
      order: {
        createdAt: 'DESC',
      },
    });

    // Extract unique doctor IDs
    const doctorsIds = [...new Set(patientMedications.map((m) => m.doctorId))];

    // Fetch all doctors in parallel
    const doctors = await Promise.all(
      doctorsIds.map((id) =>
        lastValueFrom<Doctor | null>(
          this.authClient.send({ cmd: AuthPatterns.GET_DOCTOR_BY_ID }, id),
        ),
      ),
    );

    // Create doctors lookup map
    const doctorsMap = new Map(
      doctors.map((doctor, index) => [
        doctorsIds[index],
        doctor
          ? {
              name: `${doctor.user.firstName} ${doctor.user.lastName}`,
              speciality: doctor.speciality,
            }
          : { name: 'UNKNOWN', speciality: 'UNKNOWN' },
      ]),
    );

    // Build patient object
    const patientInfo = {
      id: patient.globalId,
      name: `${patient.user.firstName} ${patient.user.lastName}`,
      gender: patient.user.gender,
      dateOfBirth: patient.user.dateOfBirth,
      socialSecurityNumber: patient.user.socialSecurityNumber.toString(),
      address: patient.address,
      job: patient.job,
    };

    // Map medications
    const medications = patientMedications.map((medication) => {
      const doctor = doctorsMap.get(medication.doctorId) ?? {
        name: 'UNKNOWN',
        speciality: 'UNKNOWN',
      };

      return {
        name: medication.name,
        dosage: medication.dosage,
        period: medication.period,
        comments: medication.comments,
        doctor: {
          name: doctor.name,
          speciality: doctor.speciality,
        },
        createdAt: medication.createdAt,
      };
    });

    return {
      patient: patientInfo,
      medications,
    };
  }

  async getPatientScans(socialSecurityNumber: string): Promise<{
    patient: {
      id: string;
      name: string;
      gender: Gender;
      dateOfBirth: Date;
      socialSecurityNumber: string;
      address: string;
      job: string;
    };
    scans: {
      name: string;
      type: ScanTypes;
      photoUrl: string;
      comments: string;
      doctor: {
        name: string;
        speciality: string;
      };
      createdAt: Date;
    }[];
  }> {
    this.validateSocialSecurityNumber(socialSecurityNumber);

    const patient = await lastValueFrom<Patient | null>(
      this.authClient.send(
        { cmd: AuthPatterns.GET_PATIENT_BY_SOCIAL_SECURITY_NUMBER },
        socialSecurityNumber,
      ),
    );

    if (!patient) {
      throw new RpcException(new ErrorResponse('Patient not found!', 404));
    }

    const patientScans = await this.scansRepository.find({
      where: {
        patientId: patient.id,
        deletedAt: IsNull(),
      },
      order: {
        createdAt: 'DESC',
      },
    });

    // Extract unique doctor IDs
    const doctorsIds = [...new Set(patientScans.map((s) => s.doctorId))];

    // Fetch all doctors in parallel
    const doctors = await Promise.all(
      doctorsIds.map((id) =>
        lastValueFrom<Doctor | null>(
          this.authClient.send({ cmd: AuthPatterns.GET_DOCTOR_BY_ID }, id),
        ),
      ),
    );

    // Create doctors lookup map
    const doctorsMap = new Map(
      doctors.map((doctor, index) => [
        doctorsIds[index],
        doctor
          ? {
              name: `${doctor.user.firstName} ${doctor.user.lastName}`,
              speciality: doctor.speciality,
            }
          : { name: 'UNKNOWN', speciality: 'UNKNOWN' },
      ]),
    );

    // Build patient object
    const patientInfo = {
      id: patient.globalId,
      name: `${patient.user.firstName} ${patient.user.lastName}`,
      gender: patient.user.gender,
      dateOfBirth: patient.user.dateOfBirth,
      socialSecurityNumber: patient.user.socialSecurityNumber.toString(),
      address: patient.address,
      job: patient.job,
    };

    // Map scans
    const scans = patientScans.map((scan) => {
      const doctor = doctorsMap.get(scan.doctorId) ?? {
        name: 'UNKNOWN',
        speciality: 'UNKNOWN',
      };

      return {
        name: scan.name,
        type: scan.type,
        photoUrl: scan.photoUrl,
        comments: scan.comments,
        doctor: {
          name: doctor.name,
          speciality: doctor.speciality,
        },
        createdAt: scan.createdAt,
      };
    });

    return {
      patient: patientInfo,
      scans,
    };
  }

  async getPatientLabs(socialSecurityNumber: string): Promise<{
    patient: {
      id: string;
      name: string;
      gender: Gender;
      dateOfBirth: Date;
      socialSecurityNumber: string;
      address: string;
      job: string;
    };
    labs: {
      name: string;
      photoUrl: string;
      comments: string;
      doctor: {
        name: string;
        speciality: string;
      };
      createdAt: Date;
    }[];
  }> {
    this.validateSocialSecurityNumber(socialSecurityNumber);

    const patient = await lastValueFrom<Patient | null>(
      this.authClient.send(
        { cmd: AuthPatterns.GET_PATIENT_BY_SOCIAL_SECURITY_NUMBER },
        socialSecurityNumber,
      ),
    );

    if (!patient) {
      throw new RpcException(new ErrorResponse('Patient not found!', 404));
    }

    const patientLabs = await this.labsRepository.find({
      where: {
        patientId: patient.id,
        deletedAt: IsNull(),
      },
      order: {
        createdAt: 'DESC',
      },
    });

    // Extract unique doctor IDs
    const doctorsIds = [...new Set(patientLabs.map((l) => l.doctorId))];

    // Fetch all doctors in parallel
    const doctors = await Promise.all(
      doctorsIds.map((id) =>
        lastValueFrom<Doctor | null>(
          this.authClient.send({ cmd: AuthPatterns.GET_DOCTOR_BY_ID }, id),
        ),
      ),
    );

    // Create doctors lookup map
    const doctorsMap = new Map(
      doctors.map((doctor, index) => [
        doctorsIds[index],
        doctor
          ? {
              name: `${doctor.user.firstName} ${doctor.user.lastName}`,
              speciality: doctor.speciality,
            }
          : { name: 'UNKNOWN', speciality: 'UNKNOWN' },
      ]),
    );

    // Build patient object
    const patientInfo = {
      id: patient.globalId,
      name: `${patient.user.firstName} ${patient.user.lastName}`,
      gender: patient.user.gender,
      dateOfBirth: patient.user.dateOfBirth,
      socialSecurityNumber: patient.user.socialSecurityNumber.toString(),
      address: patient.address,
      job: patient.job,
    };

    // Map labs
    const labs = patientLabs.map((lab) => {
      const doctor = doctorsMap.get(lab.doctorId) ?? {
        name: 'UNKNOWN',
        speciality: 'UNKNOWN',
      };

      return {
        name: lab.name,
        photoUrl: lab.photoUrl,
        comments: lab.comments,
        doctor: {
          name: doctor.name,
          speciality: doctor.speciality,
        },
        createdAt: lab.createdAt,
      };
    });

    return {
      patient: patientInfo,
      labs,
    };
  }

  async uploadLab(uploadLabInternalDto: UploadLabInternalDto): Promise<void> {
    const patient = await lastValueFrom<Patient | null>(
      this.authClient.send(
        { cmd: AuthPatterns.GET_PATIENT_BY_SOCIAL_SECURITY_NUMBER },
        uploadLabInternalDto.patientSocialSecurityNumber,
      ),
    );

    if (!patient) {
      throw new RpcException(new ErrorResponse('Patient not found!', 404));
    }

    const doctor = await this.getDoctorByUserId(
      uploadLabInternalDto.doctorUserId,
    );

    if (!doctor) {
      throw new RpcException(new ErrorResponse('Doctor not found', 404));
    }

    const lab = await this.labsRepository.save({
      name: uploadLabInternalDto.name,
      comments: uploadLabInternalDto.comments,
      doctorId: doctor.id,
      patientId: patient.id,
    });
    this.logger.log('Lab is saved successfully without photo url');

    const uploadLabPhotoInternalDto = new LabPhotoInternalDto(
      lab.globalId,
      patient.globalId,
      uploadLabInternalDto.imageBase64,
      uploadLabInternalDto.mimetype,
    );

    const photoUrl = await lastValueFrom<string>(
      this.cloudStorageClient.send(
        { cmd: CloudStoragePatterns.UPLOAD_LAB_PHOTO },
        uploadLabPhotoInternalDto,
      ),
    );
    this.logger.log('Lab photo url is successfully retrieved');

    await this.labsRepository.update({ id: lab.id }, { photoUrl });
    this.logger.log('Lab photo url is successfully updated');
  }

  async uploadScan(
    uploadScanInternalDto: UploadScanPhotoInternalDto,
  ): Promise<void> {
    const patient = await lastValueFrom<Patient | null>(
      this.authClient.send(
        { cmd: AuthPatterns.GET_PATIENT_BY_SOCIAL_SECURITY_NUMBER },
        uploadScanInternalDto.patientSocialSecurityNumber,
      ),
    );

    if (!patient) {
      throw new RpcException(new ErrorResponse('Patient not found!', 404));
    }

    const doctor = await this.getDoctorByUserId(
      uploadScanInternalDto.doctorUserId,
    );

    if (!doctor) {
      throw new RpcException(new ErrorResponse('Doctor not found', 404));
    }

    const scan = await this.scansRepository.save({
      name: uploadScanInternalDto.name,
      comments: uploadScanInternalDto.comments,
      type: uploadScanInternalDto.type,
      patientId: patient.id,
      doctorId: doctor.id,
    });
    this.logger.log('Scan is saved successfully without photo url');

    const uploadScanPhotoInternalDto = new ScanPhotoInternalDto(
      scan.globalId,
      patient.globalId,
      uploadScanInternalDto.imageBase64,
      uploadScanInternalDto.mimetype,
      uploadScanInternalDto.type,
    );

    const photoUrl = await lastValueFrom<string>(
      this.cloudStorageClient.send(
        { cmd: CloudStoragePatterns.UPLOAD_SCAN_PHOTO },
        uploadScanPhotoInternalDto,
      ),
    );
    this.logger.log('Scan photo url is successfully retrieved');

    await this.scansRepository.update({ id: scan.id }, { photoUrl });
    this.logger.log('Scan photo url is successfully updated');
  }
}
