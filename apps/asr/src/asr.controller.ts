import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AsrService } from './asr.service';
import { TranscribeAudioDto } from './transcribe-audio.dto';
import { AsrPatterns } from '@app/common';

@Controller()
export class AsrController {
  constructor(private readonly asrService: AsrService) {}

  @MessagePattern({ cmd: AsrPatterns.IS_UP })
  isUp(): string {
    return this.asrService.isUp();
  }

  @MessagePattern({ cmd: AsrPatterns.IS_READY })
  isReady(): Promise<{ service: string; status: string }> {
    return this.asrService.isReady();
  }

  @MessagePattern({ cmd: AsrPatterns.TRANSCRIBE_AUDIO })
  async transcribe(@Payload() data: TranscribeAudioDto) {
    return this.asrService.transcribe(data);
  }
}
