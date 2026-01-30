import {
  AdminPatterns,
  AsrPatterns,
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
import { v4 as uuidv4 } from 'uuid';
import { Clinic } from '../../admin/src/entities';
import { TranscribeAudioInternalDto } from '../../asr/src/dtos';
import { Doctor, Patient } from '../../auth/src/entities';
import {
  LabAudioInternalDto,
  LabPhotoInternalDto,
  MedicationAudioInternalDto,
  ScanAudioInternalDto,
  ScanPhotoInternalDto,
  VisitAudioInternalDto,
} from '../../cloud-storage/src/dtos';
import { MedicationDosage, MedicationPeriod, ScanTypes } from './constants';
import {
  CreateMedicationInternalDto,
  CreateVisitInternalDto,
  DoctorInternalPaginationRequestDto,
  UploadLabInternalDto,
  UploadScanInternalDto,
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
    @Inject(Microservices.ASR) private readonly asrClient: ClientProxy,
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
      this.logger.log(`Doctor of user id: ${doctorUserId} not found`);
      return null;
    }

    this.logger.log('Doctor is found');
    return doctor;
  }

  private async getDoctorById(doctorId: number): Promise<Doctor | null> {
    const doctor = await lastValueFrom<Doctor | null>(
      this.authClient.send({ cmd: AuthPatterns.GET_DOCTOR_BY_ID }, doctorId),
    );

    if (!doctor) {
      this.logger.log(`Doctor of id: ${doctorId} not found`);
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
      this.logger.log(`Patient of global id: ${patientGlobalId} not found`);
      return null;
    }

    this.logger.log('Patient is found');
    return patient;
  }

  private async getPatientById(patientId: number): Promise<Patient | null> {
    const patient = await lastValueFrom<Patient | null>(
      this.authClient.send({ cmd: AuthPatterns.GET_PATIENT_BY_ID }, patientId),
    );

    if (!patient) {
      this.logger.log(`Patient of id: ${patientId} not found`);
      return null;
    }

    this.logger.log('Patient is found');
    return patient;
  }

  private async getPatientBySocialSecurityNumber(
    socialSecurityNumber: string,
  ): Promise<Patient | null> {
    const patient = await lastValueFrom<Patient | null>(
      this.authClient.send(
        { cmd: AuthPatterns.GET_PATIENT_BY_SOCIAL_SECURITY_NUMBER },
        socialSecurityNumber,
      ),
    );

    if (!patient) {
      this.logger.log(
        `Patient of social security number: ${socialSecurityNumber} not found`,
      );
      return null;
    }

    this.logger.log('Patient is found');
    return patient;
  }

  private async uploadLabPhoto(
    labPhotoInternalDto: LabPhotoInternalDto,
  ): Promise<string> {
    const photoUrl = await lastValueFrom<string>(
      this.cloudStorageClient.send(
        { cmd: CloudStoragePatterns.UPLOAD_LAB_PHOTO },
        labPhotoInternalDto,
      ),
    );
    this.logger.log('Lab photo is successfully uploaded');

    return photoUrl;
  }

  private async uploadScanPhoto(
    scanPhotoInternalDto: ScanPhotoInternalDto,
  ): Promise<string> {
    const photoUrl = await lastValueFrom<string>(
      this.cloudStorageClient.send(
        { cmd: CloudStoragePatterns.UPLOAD_SCAN_PHOTO },
        scanPhotoInternalDto,
      ),
    );
    this.logger.log('Scan photo is successfully uploaded');

    return photoUrl;
  }

  private async uploadLabAudio(
    labAudioInternalDto: LabAudioInternalDto,
  ): Promise<string> {
    const photoUrl = await lastValueFrom<string>(
      this.cloudStorageClient.send(
        { cmd: CloudStoragePatterns.UPLOAD_LAB_AUDIO },
        labAudioInternalDto,
      ),
    );
    this.logger.log('Lab audio is successfully uploaded');

    return photoUrl;
  }

  private async uploadScanAudio(
    scanAudioInternalDto: ScanAudioInternalDto,
  ): Promise<string> {
    const photoUrl = await lastValueFrom<string>(
      this.cloudStorageClient.send(
        { cmd: CloudStoragePatterns.UPLOAD_SCAN_AUDIO },
        scanAudioInternalDto,
      ),
    );
    this.logger.log('Scan audio is successfully uploaded');

    return photoUrl;
  }

  private async uploadMedicationAudio(
    medicationAudioInternalDto: MedicationAudioInternalDto,
  ): Promise<string> {
    const photoUrl = await lastValueFrom<string>(
      this.cloudStorageClient.send(
        { cmd: CloudStoragePatterns.UPLOAD_MEDICATION_AUDIO },
        medicationAudioInternalDto,
      ),
    );
    this.logger.log('Medication audio is successfully uploaded');

    return photoUrl;
  }

  private async getClinicById(clinicId: number): Promise<Clinic | null> {
    const clinic = await lastValueFrom<Clinic | null>(
      this.adminClient.send<Clinic | null>(
        { cmd: AdminPatterns.GET_CLINIC_BY_ID },
        clinicId,
      ),
    );

    if (!clinic) {
      this.logger.log(`Clinic of id: ${clinicId} not found`);
      return null;
    }

    this.logger.log('Clinic is found');
    return clinic;
  }

  private async getAllClinicsWithId(): Promise<Clinic[]> {
    return await lastValueFrom<Clinic[]>(
      this.adminClient.send({ cmd: AdminPatterns.GET_ALL_CLINICS_WITH_ID }, {}),
    );
  }

  private async uploadVisitAudio(
    visitAudioInternalDto: VisitAudioInternalDto,
  ): Promise<string> {
    const photoUrl = await lastValueFrom<string>(
      this.cloudStorageClient.send(
        { cmd: CloudStoragePatterns.UPLOAD_VISIT_AUDIO },
        visitAudioInternalDto,
      ),
    );
    this.logger.log('Visit audio is successfully uploaded');

    return photoUrl;
  }

  private async extractTextFromAudio(
    transcribeAudioDto: TranscribeAudioInternalDto,
  ): Promise<string> {
    const text = await lastValueFrom<{ transcription: string }>(
      this.asrClient.send(
        { cmd: AsrPatterns.TRANSCRIBE_AUDIO },
        transcribeAudioDto,
      ),
    );
    this.logger.log('Text is successfully extracted');

    return text.transcription;
  }

  private validateSocialSecurityNumber(socialSecurityNumber: string): void {
    const regex = /^[23]\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{7}$/;
    if (!regex.test(socialSecurityNumber)) {
      throw new RpcException(
        new ErrorResponse('Invalid social security number format', 400),
      );
    }
  }

  private async deleteCloudStorageTemporaryFile(
    filePath: string,
  ): Promise<void> {
    await lastValueFrom<void>(
      this.cloudStorageClient.emit(
        { cmd: CloudStoragePatterns.DELETE_TEMPORARY_FILE },
        filePath,
      ),
    );
  }

  private async deleteAsrTemporaryFile(filePath: string): Promise<void> {
    await lastValueFrom<void>(
      this.asrClient.emit({ cmd: AsrPatterns.DELETE_TEMPORARY_FILE }, filePath),
    );
  }

  isUp(): string {
    return 'Doctor service is up';
  }

  async getAllVisits(paginationRequest: PaginationRequest): Promise<
    PaginationResponse<{
      id: string;
      diagnoses: string;
      diagnosesAudioUrl: string | null;
      patientId: string;
      doctorId: string;
      createdAt: Date;
    }>
  > {
    const [visits, count] = await this.visitsRepository.findAndCount({
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
    this.logger.log(`Visits count is ${count}`);
    this.logger.log(
      `Successfully retrieved ${paginationRequest.limit} visits from page: ${paginationRequest.page - 1}`,
    );

    // Fetch patient and doctor global IDs via RPC
    const items = await Promise.all(
      visits.map(async (visit) => {
        const [patient, doctor] = await Promise.all([
          this.getPatientById(visit.patientId),
          this.getDoctorById(visit.doctorId),
        ]);

        return {
          id: visit.globalId,
          diagnoses: visit.diagnoses,
          diagnosesAudioUrl: visit.diagnosesAudioUrl,
          patientId: patient?.globalId ?? 'UNKNOWN',
          doctorId: doctor?.globalId ?? 'UNKNOWN',
          createdAt: visit.createdAt,
        };
      }),
    );

    const paginatedResponse: PaginationResponse<{
      id: string;
      diagnoses: string;
      diagnosesAudioUrl: string | null;
      patientId: string;
      doctorId: string;
      createdAt: Date;
    }> = {
      page: paginationRequest.page,
      items,
      totalItems: count,
      totalPages: Math.ceil(count / paginationRequest.limit),
    };

    return paginatedResponse;
  }

  async getDoctorPatients(
    doctorInternalPaginationRequestDto: DoctorInternalPaginationRequestDto,
  ): Promise<
    PaginationResponse<{
      id: string;
      name: string;
      gender: Gender;
      dateOfBirth: Date;
      socialSecurityNumber: string;
      address: string | null;
      job: string | null;
    }>
  > {
    const doctor = await this.getDoctorByUserId(
      doctorInternalPaginationRequestDto.doctorUserId,
    );

    if (!doctor) {
      throw new RpcException(new ErrorResponse('Doctor not found!', 404));
    }

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

    const skip =
      (doctorInternalPaginationRequestDto.page - 1) *
      doctorInternalPaginationRequestDto.limit;
    const paginatedPatientIds = patientIds.slice(
      skip,
      skip + doctorInternalPaginationRequestDto.limit,
    );

    const patients = await Promise.all(
      paginatedPatientIds.map(async (patientId) => {
        const patient = await this.getPatientById(patientId);

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
      `Successfully retrieved ${items.length} patients for page ${doctorInternalPaginationRequestDto.page}`,
    );

    const paginatedResponse: PaginationResponse<{
      id: string;
      name: string;
      gender: Gender;
      dateOfBirth: Date;
      socialSecurityNumber: string;
      address: string | null;
      job: string | null;
    }> = {
      page: doctorInternalPaginationRequestDto.page,
      items,
      totalItems,
      totalPages: Math.ceil(
        totalItems / doctorInternalPaginationRequestDto.limit,
      ),
    };

    return paginatedResponse;
  }

  async getDoctorVisits(
    doctorInternalPaginationRequestDto: DoctorInternalPaginationRequestDto,
  ): Promise<
    PaginationResponse<{
      id: string;
      diagnoses: string;
      diagnosesAudioUrl: string | null;
      patient: {
        name: string;
        id: string;
      };
      doctor: {
        name: string;
        id: string;
      };
      createdAt: Date;
    }>
  > {
    const doctor = await this.getDoctorByUserId(
      doctorInternalPaginationRequestDto.doctorUserId,
    );

    if (!doctor) {
      throw new RpcException(new ErrorResponse('Doctor not found!', 404));
    }

    const [visits, totalItems] = await this.visitsRepository.findAndCount({
      where: {
        doctorId: doctor.id,
        deletedAt: IsNull(),
      },
      order: {
        createdAt: 'DESC',
      },
      skip:
        (doctorInternalPaginationRequestDto.page - 1) *
        doctorInternalPaginationRequestDto.limit,
      take: doctorInternalPaginationRequestDto.limit,
    });

    this.logger.log(
      `Found ${visits.length} visits for doctor ${doctor.globalId}`,
    );

    // Extract unique patient IDs and fetch all patients in parallel
    const patientIds = [...new Set(visits.map((v) => v.patientId))];
    const patients = await Promise.all(
      patientIds.map((id) => this.getPatientById(id)),
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
      diagnosesAudioUrl: visit.diagnosesAudioUrl,
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

    const paginatedResponse: PaginationResponse<{
      id: string;
      diagnoses: string;
      diagnosesAudioUrl: string | null;
      patient: {
        name: string;
        id: string;
      };
      doctor: {
        name: string;
        id: string;
      };
      createdAt: Date;
    }> = {
      page: doctorInternalPaginationRequestDto.page,
      items: visitsInformation,
      totalItems,
      totalPages: Math.ceil(
        totalItems / doctorInternalPaginationRequestDto.limit,
      ),
    };

    return paginatedResponse;
  }

  async getPatientVisits(socialSecurityNumber: string): Promise<{
    patient: {
      id: string;
      name: string;
      gender: Gender;
      dateOfBirth: Date;
      socialSecurityNumber: string;
      address: string | null;
      job: string | null;
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
        diagnosesAudioUrl: string | null;
        createdAt: Date;
      }[];
    }[];
  }> {
    this.validateSocialSecurityNumber(socialSecurityNumber);

    const patient =
      await this.getPatientBySocialSecurityNumber(socialSecurityNumber);

    if (!patient) {
      throw new RpcException(new ErrorResponse('Patient not found!', 404));
    }

    // Fetch clinics and visits in parallel
    const [clinics, patientVisits] = await Promise.all([
      this.getAllClinicsWithId(),
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
      doctorsIds.map((id) => this.getDoctorById(id)),
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
            diagnosesAudioUrl: string | null;
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
        diagnosesAudioUrl: visit.diagnosesAudioUrl,
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
      address: string | null;
      job: string | null;
    };
    medications: {
      name: string;
      dosage: MedicationDosage;
      period: MedicationPeriod;
      comments: string | null;
      commentsAudioUrl: string | null;
      doctor: {
        name: string;
        speciality: string;
      };
      createdAt: Date;
    }[];
  }> {
    this.validateSocialSecurityNumber(socialSecurityNumber);

    const patient =
      await this.getPatientBySocialSecurityNumber(socialSecurityNumber);

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
      doctorsIds.map((id) => this.getDoctorById(id)),
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
        commentsAudioUrl: medication.commentsAudioUrl,
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
      address: string | null;
      job: string | null;
    };
    scans: {
      name: string;
      type: ScanTypes;
      photoUrl: string;
      comments: string | null;
      commentsAudioUrl: string | null;
      doctor: {
        name: string;
        speciality: string;
      };
      createdAt: Date;
    }[];
  }> {
    this.validateSocialSecurityNumber(socialSecurityNumber);

    const patient =
      await this.getPatientBySocialSecurityNumber(socialSecurityNumber);

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
      doctorsIds.map((id) => this.getDoctorById(id)),
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
        commentsAudioUrl: scan.commentsAudioUrl,
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
      address: string | null;
      job: string | null;
    };
    labs: {
      name: string;
      photoUrl: string;
      comments: string | null;
      commentsAudioUrl: string | null;
      doctor: {
        name: string;
        speciality: string;
      };
      createdAt: Date;
    }[];
  }> {
    this.validateSocialSecurityNumber(socialSecurityNumber);

    const patient =
      await this.getPatientBySocialSecurityNumber(socialSecurityNumber);

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
      doctorsIds.map((id) => this.getDoctorById(id)),
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
        commentsAudioUrl: lab.commentsAudioUrl,
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

    const clinic = await this.getClinicById(doctor.clinicId);

    if (!clinic) {
      throw new RpcException(new ErrorResponse('Clinic not found!', 404));
    }

    // If no written diagnoses provided, require audio to be present
    if (
      !createVisitInternalDto.diagnoses &&
      (!createVisitInternalDto.audioFilePath ||
        !createVisitInternalDto.audioMimetype)
    ) {
      throw new RpcException(
        new ErrorResponse(
          'Either audio or written diagnoses must be provided',
          400,
        ),
      );
    }

    const visitGlobalId = uuidv4();
    const visit = this.visitsRepository.create({
      globalId: visitGlobalId,
      diagnoses: '',
      diagnosesAudioUrl: null,
      patientId: patient.id,
      doctorId: doctor.id,
      clinicId: doctor.clinicId,
    });

    if (createVisitInternalDto.diagnoses) {
      visit.diagnoses = createVisitInternalDto.diagnoses;
    }

    if (
      createVisitInternalDto.audioFilePath &&
      createVisitInternalDto.audioMimetype
    ) {
      const visitAudioInternalDto = new VisitAudioInternalDto(
        visitGlobalId,
        patient.globalId,
        createVisitInternalDto.audioFilePath,
        createVisitInternalDto.audioMimetype,
      );

      visit.diagnosesAudioUrl = await this.uploadVisitAudio(
        visitAudioInternalDto,
      );

      if (!createVisitInternalDto.diagnoses) {
        const transcribeAudioDto = new TranscribeAudioInternalDto();
        transcribeAudioDto.filePath = createVisitInternalDto.audioFilePath;

        visit.diagnoses = await this.extractTextFromAudio(transcribeAudioDto);
        this.logger.log('Diagnoses is successfully extracted from visit audio');
      }

      await this.deleteCloudStorageTemporaryFile(
        createVisitInternalDto.audioFilePath,
      );
    }

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

    const medicationGlobalId = uuidv4();
    const medication = this.medicationsRepository.create({
      globalId: medicationGlobalId,
      name: createMedicationInternalDto.name,
      comments: null,
      doctorId: doctor.id,
      patientId: patient.id,
      period: createMedicationInternalDto.period,
      dosage: createMedicationInternalDto.dosage,
      commentsAudioUrl: null,
    });

    if (createMedicationInternalDto.comments) {
      medication.comments = createMedicationInternalDto.comments;
    }

    if (
      createMedicationInternalDto.audioFilePath &&
      createMedicationInternalDto.audioMimetype
    ) {
      const medicationAudioInternalDto: MedicationAudioInternalDto = {
        medicationGlobalId,
        patientGlobalId: patient.globalId,
        audioFilePath: createMedicationInternalDto.audioFilePath,
        audioMimetype: createMedicationInternalDto.audioMimetype,
      };

      medication.commentsAudioUrl = await this.uploadMedicationAudio(
        medicationAudioInternalDto,
      );

      if (!createMedicationInternalDto.comments) {
        const transcribeAudioDto: TranscribeAudioInternalDto = {
          filePath: createMedicationInternalDto.audioFilePath,
        };

        medication.comments =
          await this.extractTextFromAudio(transcribeAudioDto);
        this.logger.log(
          'Comments are successfully extracted from medication audio',
        );
      }

      await this.deleteCloudStorageTemporaryFile(
        createMedicationInternalDto.audioFilePath,
      );
    }

    await this.medicationsRepository.insert(medication);
    this.logger.log('Successfully inserted medication');
  }

  async uploadLab(uploadLabInternalDto: UploadLabInternalDto): Promise<void> {
    const patient = await this.getPatientBySocialSecurityNumber(
      uploadLabInternalDto.patientSocialSecurityNumber,
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

    const labGlobalId = uuidv4();
    const lab = this.labsRepository.create({
      globalId: labGlobalId,
      name: uploadLabInternalDto.name,
      comments: null,
      doctorId: doctor.id,
      patientId: patient.id,
      photoUrl: '',
      commentsAudioUrl: null,
    });

    const labPhotoInternalDto: LabPhotoInternalDto = {
      labGlobalId,
      patientGlobalId: patient.globalId,
      imageFilePath: uploadLabInternalDto.imageFilePath,
      imageMimetype: uploadLabInternalDto.imageMimetype,
    };

    lab.photoUrl = await this.uploadLabPhoto(labPhotoInternalDto);

    await this.deleteCloudStorageTemporaryFile(
      uploadLabInternalDto.imageFilePath,
    );

    if (uploadLabInternalDto.comments) {
      lab.comments = uploadLabInternalDto.comments;
    }

    if (
      uploadLabInternalDto.audioFilePath &&
      uploadLabInternalDto.audioMimetype
    ) {
      const labAudioInternalDto: LabAudioInternalDto = {
        labGlobalId,
        patientGlobalId: patient.globalId,
        audioFilePath: uploadLabInternalDto.audioFilePath,
        audioMimetype: uploadLabInternalDto.audioMimetype,
      };

      lab.commentsAudioUrl = await this.uploadLabAudio(labAudioInternalDto);

      if (!uploadLabInternalDto.comments) {
        const transcribeAudioDto: TranscribeAudioInternalDto = {
          filePath: uploadLabInternalDto.audioFilePath,
        };

        lab.comments = await this.extractTextFromAudio(transcribeAudioDto);
        this.logger.log('Comments are successfully extracted from lab audio');
      }

      await this.deleteCloudStorageTemporaryFile(
        uploadLabInternalDto.audioFilePath,
      );
    }

    await this.labsRepository.insert(lab);
    this.logger.log('Lab is inserted successfully');
  }

  async uploadScan(
    uploadScanInternalDto: UploadScanInternalDto,
  ): Promise<void> {
    const patient = await this.getPatientBySocialSecurityNumber(
      uploadScanInternalDto.patientSocialSecurityNumber,
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

    const scanGlobalId = uuidv4();
    const scan = this.scansRepository.create({
      globalId: scanGlobalId,
      name: uploadScanInternalDto.name,
      type: uploadScanInternalDto.type,
      comments: null,
      doctorId: doctor.id,
      patientId: patient.id,
      photoUrl: '',
      commentsAudioUrl: null,
    });

    const scanPhotoInternalDto: ScanPhotoInternalDto = {
      scanGlobalId,
      patientGlobalId: patient.globalId,
      imageFilePath: uploadScanInternalDto.imageFilePath,
      imageMimetype: uploadScanInternalDto.imageMimetype,
    };

    scan.photoUrl = await this.uploadScanPhoto(scanPhotoInternalDto);

    await this.deleteCloudStorageTemporaryFile(
      uploadScanInternalDto.imageFilePath,
    );

    if (uploadScanInternalDto.comments) {
      scan.comments = uploadScanInternalDto.comments;
    }

    if (
      uploadScanInternalDto.audioFilePath &&
      uploadScanInternalDto.audioMimetype
    ) {
      const scanAudioInternalDto = new ScanAudioInternalDto(
        scanGlobalId,
        patient.globalId,
        uploadScanInternalDto.audioFilePath,
        uploadScanInternalDto.audioMimetype,
      );

      scan.commentsAudioUrl = await this.uploadScanAudio(scanAudioInternalDto);

      if (!uploadScanInternalDto.comments) {
        const transcribeAudioDto: TranscribeAudioInternalDto = {
          filePath: uploadScanInternalDto.audioFilePath,
        };

        scan.comments = await this.extractTextFromAudio(transcribeAudioDto);
        this.logger.log('Comments are successfully extracted from scan audio');
      }

      await this.deleteCloudStorageTemporaryFile(
        uploadScanInternalDto.audioFilePath,
      );
    }

    await this.scansRepository.insert(scan);
    this.logger.log('Scan is inserted successfully');
  }

  async searchForPatientBySocilaSecurityNumber(
    socialSecurityNumber: string,
  ): Promise<{
    id: string;
    name: string;
    gender: Gender;
    dateOfBirth: Date;
    socialSecurityNumber: string;
    address: string | null;
    job: string | null;
    createdAt: Date;
  }> {
    const patient =
      await this.getPatientBySocialSecurityNumber(socialSecurityNumber);

    if (!patient) {
      throw new RpcException(new ErrorResponse('Patient not found!', 404));
    }

    return {
      id: patient.globalId,
      name: `${patient.user.firstName} ${patient.user.lastName}`,
      gender: patient.user.gender,
      dateOfBirth: patient.user.dateOfBirth,
      socialSecurityNumber: String(patient.user.socialSecurityNumber),
      job: patient.job,
      address: patient.address,
      createdAt: patient.createdAt,
    };
  }
}
