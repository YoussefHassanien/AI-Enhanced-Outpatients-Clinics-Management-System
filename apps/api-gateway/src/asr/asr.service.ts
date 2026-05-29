import { AsrPatterns, Microservices } from '@app/common';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Response } from 'express';
import { promises as fs } from 'fs';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AsrService {
  constructor(
    @Inject(Microservices.ASR) private readonly asrClient: ClientProxy,
  ) {}

  private validateAudioFile(file: Express.Multer.File) {
    if (!file.mimetype.startsWith('audio/')) {
      throw new BadRequestException(
        'Invalid file type. Only audio and video files are allowed.',
      );
    }

    if (file.size > 20 * 1024 * 1024) {
      // 20MB
      throw new BadRequestException('File size exceeds 20MB limit.');
    }
  }

  async isUp(res: Response) {
    const result = await firstValueFrom<{ message: string; status: number }>(
      this.asrClient.send({ cmd: AsrPatterns.IS_UP }, {}),
    );

    return res.status(result.status).json(result.message);
  }

  async transcribe(file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required.');
    }

    this.validateAudioFile(file);
    const filePath = file.path;

    let audioBase64: string;

    try {
      const audioBuffer = await fs.readFile(filePath);
      audioBase64 = audioBuffer.toString('base64');
    } catch {
      throw new InternalServerErrorException(
        'Failed to read uploaded audio file.',
      );
    } finally {
      try {
        await fs.unlink(filePath);
      } catch {
        // ignore if the file is already gone.
      }
    }

    return await firstValueFrom<{ transcription: string }>(
      this.asrClient.send(
        { cmd: AsrPatterns.TRANSCRIBE_AUDIO },
        { audio_base64: audioBase64 },
      ),
    );
  }
}
