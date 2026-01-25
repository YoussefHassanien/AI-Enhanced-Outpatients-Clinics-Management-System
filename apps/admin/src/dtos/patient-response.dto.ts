import { Gender } from '@app/common';

export class PatientResponseDTO {
  id: string;
  address: string;
  job: string;
  socialSecurityNumber: bigint;
  gender: Gender;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  createdAt: Date;
}
