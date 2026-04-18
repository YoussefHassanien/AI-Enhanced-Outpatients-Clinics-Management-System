import { PaginationRequest } from '@app/common';
import { IsInt, IsPositive } from 'class-validator';

export class ClinicInternalPaginationRequestDto extends PaginationRequest {
  @IsInt()
  @IsPositive()
  clinicId: number;

  constructor(paginationRequest: PaginationRequest, clinicId: number) {
    super();
    Object.assign(this, paginationRequest);
    this.clinicId = clinicId;
  }
}
