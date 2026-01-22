import { AsrPatterns, Microservices } from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AsrService {
  constructor(
    @Inject(Microservices.ASR) private readonly asrClient: ClientProxy,
  ) {}

  async transcribe(filePath: string) {
    return await firstValueFrom(
      this.asrClient.send(
        { cmd: AsrPatterns.TRANSCRIBE_AUDIO },
        { file: filePath },
      ),
    );
  }

  async isUp() {
    return await firstValueFrom(
      this.asrClient.send({ cmd: AsrPatterns.IS_UP }, {}),
    );
  }

  async isReady() {
    return await firstValueFrom(
      this.asrClient.send({ cmd: AsrPatterns.IS_READY }, {}),
    );
  }
}
