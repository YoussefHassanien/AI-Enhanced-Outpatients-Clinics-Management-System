import { PaginationRequest } from '@app/common';
import { IsInt, IsPositive } from 'class-validator';

export class AdminInternalPaginationRequestDto {
  @IsInt()
  @IsPositive()
  adminUserId: number;

  paginationRequest: PaginationRequest;

  constructor(paginationRequest: PaginationRequest, adminUserId: number) {
    this.paginationRequest = paginationRequest;
    this.adminUserId = adminUserId;
  }
}
