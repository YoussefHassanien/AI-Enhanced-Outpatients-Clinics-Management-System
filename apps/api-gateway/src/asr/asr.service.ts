import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Microservices, AsrPatterns } from '@app/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AsrService {
  constructor(
    @Inject(Microservices.ASR) private readonly asrClient: ClientProxy,
  ) {}

  async transcribe(filePath: string) {
    return await firstValueFrom(
      this.asrClient.send({ cmd: AsrPatterns.TRANSCRIBE_AUDIO }, { file: filePath }),
    );
  }
}
