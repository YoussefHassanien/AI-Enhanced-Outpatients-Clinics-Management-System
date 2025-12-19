import { Controller, Logger } from '@nestjs/common';
import { Ctx, MessagePattern, RmqContext } from '@nestjs/microservices';
import { DoctorPatterns } from './constants';
import { DoctorService } from './doctor.service';

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
}
