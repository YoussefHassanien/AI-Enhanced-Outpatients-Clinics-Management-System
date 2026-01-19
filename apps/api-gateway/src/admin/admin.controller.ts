import {
  Gender,
  PaginationRequest,
  PaginationResponse,
  Role,
  Roles,
} from '@app/common';
import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  async isUp(): Promise<string> {
    return await this.adminService.isUp();
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Get('doctors')
  async getAllDoctors(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
  ): Promise<
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
    const paginationRequest: PaginationRequest = {
      page,
      limit,
    };
    return await this.adminService.getAllDoctors(paginationRequest);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @Get('patients')
  async getAllPatients(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
  ): Promise<
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
    const paginationRequest: PaginationRequest = {
      page,
      limit,
    };
    return await this.adminService.getAllPatients(paginationRequest);
  }
}
