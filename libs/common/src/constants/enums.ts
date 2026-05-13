export enum Role {
  SUPER_ADMIN,
  DOCTOR,
  PATIENT,
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
  SUPER_ADMIN = 'SUPER_ADMIN_MICROSERVICE',
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
  DOCTOR_UPDATE = 'auth.doctor.update',
  DOCTOR_DELETE = 'auth.doctor.delete',
  DOCTOR_RESTORE = 'auth.doctor.restore',
  GET_CLINICAL_STAFF_BY_USER_ID = 'auth.getClinicalStaffByUserId',
  GET_CLINIC_DOCTORS = 'auht.clinic.doctors',
}

export enum DoctorPatterns {
  IS_UP = 'doctor.isUp',
  VISIT_CREATE = 'doctor.visit.create',
  MEDICATION_CREATE = 'doctor.medication.create',
  LAB_UPLOAD = 'doctor.lab.upload',
  SCAN_UPLOAD = 'doctor.scan.upload',
  VISIT_UPDATE = 'doctor.visit.update',
  MEDICATION_UPDATE = 'doctor.medication.update',
  LAB_UPDATE = 'doctor.lab.update',
  SCAN_UPDATE = 'doctor.scan.update',
  GET_PATIENT_MEDICATIONS = 'doctor.patient.medications',
  GET_PATIENT_VISITS = 'doctor.patient.visits',
  GET_PATIENT_LABS = 'doctor.patient.labs',
  GET_PATIENT_SCANS = 'doctor.patient.scans',
  GET_ALL_VISITS = 'doctor.admin.visits',
  GET_DOCTOR_PATIENTS = 'doctor.patients',
  GET_DOCTOR_VISITS = 'doctor.visits',
  GET_CLINIC_VISITS = 'doctor.clinic.visits',
  GET_CLINIC_PATIENTS = 'doctor.clinic.patients',
  SEARCH_FOR_PATIENT_BY_SOCIAL_SECURITY_NUMBER = 'doctor.searchForPatientBySocilaSecurityNumber',
}

export enum CommonServices {
  LOGGING = 'WINSTON_LOGGER',
}

export enum SuperAdminPatterns {
  IS_UP = 'superAdmin.isUp',
  GET_ALL_DOCTORS = 'superAdmin.getAllDoctors',
  GET_ALL_PATIENTS = 'superAdmin.getAllPatients',
  GET_ALL_VISITS = 'superAdmin.getAllVisits',
  UPDATE_PATIENT = 'superAdmin.updatePatient',
  CREATE_CLINIC = 'superAdmin.clinic.create',
  UPDATE_CLINIC = 'superAdmin.clinic.update',
  DELETE_CLINIC = 'superAdmin.clinic.delete',
  RESTORE_CLINIC = 'superAdmin.clinic.restore',
  GET_ALL_CLINICS = 'superAdmin.getAllClinics',
  GET_ALL_CLINICS_WITH_ID = 'superAdmin.getAllClinicsWithId',
  GET_CLINIC_BY_ID = 'superAdmin.getClinicById',
  GET_CLINIC_BY_GLOBAL_ID = 'superAdmin.getClinicByGlobalId',
  GET_PATIENT_BY_GLOBAL_ID = 'superAdmin.getPatientByGlobalId',
  GET_DOCTOR_BY_GLOBAL_ID = 'superAdmin.getDoctorByGlobalId',
  UPDATE_DOCTOR = 'superAdmin.updateDoctor',
  DELETE_DOCTOR = 'superAdmin.deleteDoctor',
  RESTORE_DOCTOR = 'superAdmin.restoreDoctor',
  GET_CLINIC_DOCTORS = 'superAdmin.getClinicDoctors',
  GET_CLINIC_PATIENTS = 'superAdmin.getClinicPatients',
  GET_CLINIC_VISITS = 'superAdmin.getClinicVisits',
  VISIT_CREATE = 'superAdmin.visit.create',
  MEDICATION_CREATE = 'superAdmin.medication.create',
  LAB_UPLOAD = 'superAdmin.lab.upload',
  SCAN_UPLOAD = 'superAdmin.scan.upload',
  VISIT_UPDATE = 'superAdmin.visit.update',
  MEDICATION_UPDATE = 'superAdmin.medication.update',
  LAB_UPDATE = 'superAdmin.lab.update',
  SCAN_UPDATE = 'superAdmin.scan.update',
  GET_SUPER_ADMIN_PATIENTS = 'superAdmin.patients',
  GET_SUPER_ADMIN_VISITS = 'superAdmin.visits',
  SEARCH_FOR_PATIENT_BY_SOCIAL_SECURITY_NUMBER = 'superAdmin.searchForPatientBySocilaSecurityNumber',
  GET_PATIENT_VISITS = 'superAdmin.patient.visits',
  GET_PATIENT_MEDICATIONS = 'superAdmin.patient.medications',
  GET_PATIENT_LABS = 'superAdmin.patient.labs',
  GET_PATIENT_SCANS = 'superAdmin.patient.scans',
}

export enum AsrPatterns {
  TRANSCRIBE_AUDIO = 'asr.transcribeAudio',
  DELETE_TEMPORARY_FILE = 'asr.deleteTemporaryFile',
  IS_UP = 'asr.isUp',
}

export enum OcrPatterns {
  IS_UP = 'ocr.isUp',
  PROCESS_ID = 'ocr.processId',
}

export enum CloudStoragePatterns {
  IS_UP = 'cloud-storage.isUp',
  UPLOAD_LAB_PHOTO = 'cloud-storage.uploadLabPhoto',
  UPLOAD_SCAN_PHOTO = 'cloud-storage.uploadScanPhoto',
  UPLOAD_LAB_AUDIO = 'cloud-storage.uploadLabAudio',
  UPLOAD_SCAN_AUDIO = 'cloud-storage.uploadScanAudio',
  UPLOAD_MEDICATION_AUDIO = 'cloud-storage.uploadMedicationAudio',
  UPLOAD_VISIT_AUDIO = 'cloud-storage.uploadVisitAudio',
  DELETE_TEMPORARY_FILE = 'cloud-storage.deleteTemporaryFile',
}
