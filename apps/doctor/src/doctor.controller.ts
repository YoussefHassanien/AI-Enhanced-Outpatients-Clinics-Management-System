import { Controller, Get } from '@nestjs/common';
import { DoctorService } from './doctor.service';

@Controller()
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  getHello(): string {
    return this.doctorService.getHello();
  }
}
