import {
  AuthPatterns,
  CommonServices,
  ErrorResponse,
  Gender,
  LoggingService,
  Microservices,
  PaginationRequest,
  PaginationResponse,
} from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AdminService {
  private readonly logger: LoggingService;

  constructor(
    @Inject(Microservices.AUTH) private readonly authClient: ClientProxy,
    @Inject(Microservices.DOCTOR) private readonly doctorClient: ClientProxy,
    @Inject(CommonServices.LOGGING) logger: LoggingService,
  ) {
    this.logger = logger;
  }
  isUp(): string {
    return 'Admin service is up';
  }

  async getAllDoctors(paginationRequest: PaginationRequest): Promise<
    PaginationResponse<{
      id: string;
      phone: string;
      email: string;
      speciality: string;
      isApproved: boolean;
      user: {
        id: string;
        socialSecurityNumber: bigint;
        gender: Gender;
        firstName: string;
        lastName: string;
        dateOfBirth: Date;
      };
    }>
  > {
    if (paginationRequest.limit <= 0 || paginationRequest.page <= 0) {
      throw new RpcException(
        new ErrorResponse('Page and limit must be positive integers', 400),
      );
    }

    return await lastValueFrom<
      PaginationResponse<{
        id: string;
        phone: string;
        email: string;
        speciality: string;
        isApproved: boolean;
        user: {
          id: string;
          socialSecurityNumber: bigint;
          gender: Gender;
          firstName: string;
          lastName: string;
          dateOfBirth: Date;
        };
      }>
    >(
      this.authClient.send(
        { cmd: AuthPatterns.GET_ALL_DOCTORS },
        paginationRequest,
      ),
    );
  }

  async getAllPatients(paginationRequest: PaginationRequest): Promise<
    PaginationResponse<{
      id: string;
      address: string;
      job: string;
      user: {
        id: string;
        socialSecurityNumber: bigint;
        gender: Gender;
        firstName: string;
        lastName: string;
        dateOfBirth: Date;
      };
    }>
  > {
    if (paginationRequest.limit <= 0 || paginationRequest.page <= 0) {
      throw new RpcException(
        new ErrorResponse('Page and limit must be positive integers', 400),
      );
    }

    return await lastValueFrom<
      PaginationResponse<{
        id: string;
        address: string;
        job: string;
        user: {
          id: string;
          socialSecurityNumber: bigint;
          gender: Gender;
          firstName: string;
          lastName: string;
          dateOfBirth: Date;
        };
      }>
    >(
      this.authClient.send(
        { cmd: AuthPatterns.GET_ALL_PATIENTS },
        paginationRequest,
      ),
    );
  }
}
