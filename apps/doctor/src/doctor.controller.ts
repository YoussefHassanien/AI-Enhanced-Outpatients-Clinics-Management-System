import { DoctorPatterns } from '@app/common';
import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { DoctorService } from './doctor.service';
import { CreateMedicationInternalDto, CreateVisitInternalDto } from './dtos';

@Controller()
export class DoctorController {
  private readonly logger: Logger;
  constructor(private readonly doctorService: DoctorService) {
    this.logger = new Logger(DoctorController.name);
  }

  @MessagePattern({ cmd: DoctorPatterns.IS_UP })
  isUp(@Ctx() context: RmqContext): string {
    this.logger.log(
      `Message of fields: ${JSON.stringify(context.getMessage().fields)} and properties: ${JSON.stringify(context.getMessage().properties)} received with Pattern: ${context.getPattern()}`,
    );

    return this.doctorService.isUp();
  }

  @MessagePattern({ cmd: DoctorPatterns.VISIT_CREATE })
  async visitCreate(
    @Payload() createVisitInternalDto: CreateVisitInternalDto,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(
      `Message of fields: ${JSON.stringify(context.getMessage().fields)} and properties: ${JSON.stringify(context.getMessage().properties)} received with Pattern: ${context.getPattern()}`,
    );

    await this.doctorService.createVisit(createVisitInternalDto);

    return { message: 'Visit is successfully created' };
  }

  @MessagePattern({ cmd: DoctorPatterns.MEDICATION_CREATE })
  async medicationCreate(
    @Payload() createMedicationInternalDto: CreateMedicationInternalDto,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(
      `Message of fields: ${JSON.stringify(context.getMessage().fields)} and properties: ${JSON.stringify(context.getMessage().properties)} received with Pattern: ${context.getPattern()}`,
    );

    await this.doctorService.createMedication(createMedicationInternalDto);

    return { message: 'Medication is successfully created' };
  }
}
