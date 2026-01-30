import { Gender } from '@app/common';

export class PatientResponseDTO {
  id: string;
  address: string | null;
  job: string | null;
  socialSecurityNumber: bigint;
  gender: Gender;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  createdAt: Date;
}
