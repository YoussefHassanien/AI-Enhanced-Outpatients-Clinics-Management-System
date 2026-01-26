import { Gender } from '@app/common';

export class DoctorResponseDTO {
  id: string;
  phone: string;
  email: string;
  speciality: string;
  isApproved: boolean;
  socialSecurityNumber: bigint;
  gender: Gender;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  createdAt: Date;
  clinic?: {
    id: string;
    name: string;
  }
}
