import { AsrPatterns, Microservices } from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Response } from 'express';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AsrService {
  constructor(
    @Inject(Microservices.ASR) private readonly asrClient: ClientProxy,
  ) {}

  async isUp(res: Response) {
    const result = await firstValueFrom<{ message: string; status: number }>(
      this.asrClient.send({ cmd: AsrPatterns.IS_UP }, {}),
    );

    return res.status(result.status).json(result.message);
  }
}
