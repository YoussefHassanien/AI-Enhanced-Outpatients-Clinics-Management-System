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

export enum Services {
  AUTH = 'AUTH_SERVICE',
  DOCTOR = 'DOCTOR_SERVICE',
}

export enum AuthPatterns {
  IS_UP = 'auth.isUp',
  LOGIN = 'auth.login',
  ADMIN_CREATE = 'auth.admin.create',
  DOCTOR_CREATE = 'auth.doctor.create',
  PATIENT_CREATE = 'auth.patient.create',
  GET_USER = 'auth.getUser',
  GET_DOCTOR_BY_USER_ID = 'auth.getDoctorByUserId',
  GET_PATIENT_BY_GLOBAL_ID = 'auth.getPatientByGlobalId',
  GET_ADMIN_BY_USER_ID = 'auth.getAdminByUserId',
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
}
