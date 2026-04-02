import { AsrPatterns } from '@app/common';
import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { AsrService } from './asr.service';
import { TranscribeAudioInternalDto } from './dtos';

@Controller()
export class AsrController {
  constructor(private readonly asrService: AsrService) {}

  @MessagePattern({ cmd: AsrPatterns.IS_UP })
  async isUp(): Promise<{ status: number; message: string }> {
    return await this.asrService.isUp();
  }

  @MessagePattern({ cmd: AsrPatterns.TRANSCRIBE_AUDIO })
  async transcribeAudio(
    @Payload() transcribeAudioInternalDto: TranscribeAudioInternalDto,
  ): Promise<{ transcription: string }> {
    return this.asrService.transcribeAudio(transcribeAudioInternalDto);
  }

  @EventPattern({ cmd: AsrPatterns.DELETE_TEMPORARY_FILE })
  async deleteTemporaryFile(@Payload() filePath: string): Promise<void> {
    await this.asrService.deleteTemporaryFile(filePath);
  }
}
