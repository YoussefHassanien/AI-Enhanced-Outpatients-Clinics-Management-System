export enum Role {
  SUPER_ADMIN,
  ADMIN,
  PATIENT,
  DOCTOR,
}

export enum Language {
  ENGLISH,
  ARABIC,
}

export enum Environment {
  PRODUCTION = 'prod',
  DEVELOPMENT = 'dev',
  TESTING = 'test',
}

export enum Gender {
  MALE,
  FEMALE,
}

export enum Microservices {
  AUTH = 'AUTH_MICROSERVICE',
  DOCTOR = 'DOCTOR_MICROSERVICE',
  ADMIN = 'ADMIN_MICROSERVICE',
  ASR = 'ASR_MICROSERVICE',
  OCR = 'OCR_MICROSERVICE',
  CLOUD_STORAGE = 'CLOUD_STORAGE_MICROSERVICE',
}

export enum AuthPatterns {
  IS_UP = 'auth.isUp',
  LOGIN = 'auth.login',
  ADMIN_CREATE = 'auth.admin.create',
  DOCTOR_CREATE = 'auth.doctor.create',
  PATIENT_CREATE = 'auth.patient.create',
  GET_USER = 'auth.user',
  GET_DOCTOR_BY_USER_ID = 'auth.getDoctorByUserId',
  GET_PATIENT_BY_GLOBAL_ID = 'auth.getPatientByGlobalId',
  GET_ADMIN_BY_USER_ID = 'auth.getAdminByUserId',
  GET_ALL_DOCTORS = 'auth.admin.doctors',
  GET_ALL_PATIENTS = 'auth.admin.patients',
  GET_PATIENT_BY_ID = 'auth.getPatientById',
  GET_DOCTOR_BY_ID = 'auth.getDoctorById',
  GET_DOCTOR_BY_GLOBAL_ID = 'auth.getDoctorByGlobalId',
  PATIENT_UPDATE = 'auth.patient.update',
  GET_PATIENT_BY_SOCIAL_SECURITY_NUMBER = 'auth.getPatientBySocialSecurityNumber',
}

export enum DoctorPatterns {
  IS_UP = 'doctor.isUp',
  VISIT_CREATE = 'doctor.visit.create',
  MEDICATION_CREATE = 'doctor.medication.create',
  LAB_UPLOAD = 'doctor.lab.upload',
  SCAN_UPLOAD = 'doctor.scan.upload',
  GET_PATIENT_MEDICATIONS = 'doctor.patient.medications',
  GET_PATIENT_VISITS = 'doctor.patient.visits',
  GET_PATIENT_LABS = 'doctor.patient.labs',
  GET_PATIENT_SCANS = 'doctor.patient.scans',
  GET_ALL_VISITS = 'doctor.admin.visits',
}

export enum CommonServices {
  LOGGING = 'WINSTON_LOGGER',
}

export enum AdminPatterns {
  IS_UP = 'admin.isUp',
  GET_ALL_VISITS = 'admin.getAllVisits',
  GET_ALL_PATIENTS = 'admin.getAllPatients',
  GET_ALL_DOCTORS = 'admin.getAllDoctors',
  UPDATE_PATIENT = 'admin.updatePatient',
  CREATE_CLINIC = 'admin.clinic.create',
  GET_ALL_CLINICS_WITH_GLOBAL_ID = 'admin.getAllClinicsWithGlobalId',
  GET_ALL_CLINICS_WITH_ID = 'admin.getAllClinicsWithId',
  GET_CLINIC_BY_GLOBAL_ID = 'admin.getClinicByGlobalId',
  GET_CLINIC_BY_ID = 'admin.getClinicById',
  GET_PATIENT_BY_GLOBAL_ID = 'admin.getPatientByGlobalId',
  GET_DOCTOR_BY_GLOBAL_ID = 'admin.getDoctorByGlobalId',
}

export enum AsrPatterns {
  TRANSCRIBE_AUDIO = 'transcribe-audio',
  IS_UP = 'asr.isUp',
  IS_READY = 'asr.isReady',
}

export enum OcrPatterns {
  IS_UP = 'ocr.isUp',
  PROCESS_ID = 'ocr.processId',
}

export enum CloudStoragePatterns {
  IS_UP = 'cloud-storage.isUp',
  UPLOAD_LAB_PHOTO = 'cloud-storage.uploadLabPhoto',
  UPLOAD_SCAN_PHOTO = 'cloud-storage.uploadScanPhoto',
}
