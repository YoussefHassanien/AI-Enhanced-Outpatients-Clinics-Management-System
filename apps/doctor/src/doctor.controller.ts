import { DoctorPatterns } from '@app/common';
import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
  RpcException,
} from '@nestjs/microservices';
import { DoctorService } from './doctor.service';
import { CreateVisitInternalDto } from './dtos';

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

    const visit = await this.doctorService.createVisit(createVisitInternalDto);

    if (visit instanceof RpcException) {
      this.logger.error(visit.getError());
      throw visit;
    }

    return { message: 'Visit is successfully created' };
  }
}
