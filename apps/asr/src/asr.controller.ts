import { AsrPatterns } from '@app/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AsrService } from './asr.service';
import { TranscribeAudioDto } from './dtos';

@Controller()
export class AsrController {
  constructor(private readonly asrService: AsrService) {}

  @MessagePattern({ cmd: AsrPatterns.IS_UP })
  async isUp(): Promise<{ status: number; message: string }> {
    return await this.asrService.isUp();
  }

  @MessagePattern({ cmd: AsrPatterns.TRANSCRIBE_AUDIO })
  async transcribe(
    @Payload() data: TranscribeAudioDto,
  ): Promise<{ transcription: string }> {
    return this.asrService.transcribe(data);
  }
}
