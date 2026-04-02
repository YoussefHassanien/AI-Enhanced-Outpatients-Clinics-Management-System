import { PaginationRequest } from '@app/common';
import { IsNumber } from 'class-validator';

export class DoctorInternalPaginationRequestDto extends PaginationRequest {
  @IsNumber()
  doctorUserId: number;

  constructor(paginationRequest: PaginationRequest, doctorUserId: number) {
    super();
    Object.assign(this, paginationRequest);
    this.doctorUserId = doctorUserId;
  }
}
