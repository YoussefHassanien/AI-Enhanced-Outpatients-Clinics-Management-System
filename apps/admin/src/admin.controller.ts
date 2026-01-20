import { AdminPatterns, PaginationRequest } from '@app/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UpdatePatientInternalDto } from '../../auth/src/dtos';
import { AdminService } from './admin.service';

@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @MessagePattern({ cmd: AdminPatterns.IS_UP })
  isUp(): string {
    return this.adminService.isUp();
  }

  @MessagePattern({ cmd: AdminPatterns.GET_ALL_DOCTORS })
  async getAllDoctors(@Payload() paginationRequest: PaginationRequest) {
    return await this.adminService.getAllDoctors(paginationRequest);
  }

  @MessagePattern({ cmd: AdminPatterns.GET_ALL_PATIENTS })
  async getAllPatients(@Payload() paginationRequest: PaginationRequest) {
    return await this.adminService.getAllPatients(paginationRequest);
  }

  @MessagePattern({ cmd: AdminPatterns.GET_ALL_VISITS })
  async getAllVisits(@Payload() paginationRequest: PaginationRequest) {
    return await this.adminService.getAllVisits(paginationRequest);
  }

  @MessagePattern({ cmd: AdminPatterns.UPDATE_PATIENT })
  async updatePatient(
    @Payload() updatePatientInternalDto: UpdatePatientInternalDto,
  ) {
    return await this.adminService.updatePatient(updatePatientInternalDto);
  }
}
