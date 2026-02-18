import { PaginationRequest } from '@app/common';
import { IsNumber } from 'class-validator';

export class ClinicInternalPaginationRequestDto extends PaginationRequest {
  @IsNumber()
  clinicId: number;

  constructor(paginationRequest: PaginationRequest, clinicId: number) {
    super();
    Object.assign(this, paginationRequest);
    this.clinicId = clinicId;
  }
}
