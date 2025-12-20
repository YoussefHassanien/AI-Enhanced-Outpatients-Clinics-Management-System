import { DoctorPatterns, Services } from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  CreateVisitDto,
  CreateVisitInternalDto,
} from '../../../doctor/src/dtos';
import { Visit } from '../../../doctor/src/entities';

@Injectable()
export class DoctorService {
  constructor(
    @Inject(Services.DOCTOR) private readonly doctorClient: ClientProxy,
  ) {}

  async isUp() {
    return await lastValueFrom<string>(
      this.doctorClient.send({ cmd: DoctorPatterns.IS_UP }, {}),
    );
  }

  async createVisit(createVisitDto: CreateVisitDto, userId: number) {
    const createVisitInternalDto = new CreateVisitInternalDto(
      createVisitDto,
      userId,
    );

    return await lastValueFrom<Promise<Visit>>(
      this.doctorClient.send(
        { cmd: DoctorPatterns.VISIT_CREATE },
        createVisitInternalDto,
      ),
    );
  }
}
