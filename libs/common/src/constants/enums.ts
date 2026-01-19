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
  GET_PATIENT_HISTORY = 'doctor.patient.history',
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
}
