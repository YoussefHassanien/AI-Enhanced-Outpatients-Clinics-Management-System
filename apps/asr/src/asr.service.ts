import { CommonServices, ErrorResponse, LoggingService } from '@app/common';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import FormData from 'form-data';
import * as fs from 'fs';
import { firstValueFrom } from 'rxjs';
import { TranscribeAudioInternalDto } from './dtos';

@Injectable()
export class AsrService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CommonServices.LOGGING)
    private readonly logger: LoggingService,
  ) {}

  async isUp(): Promise<{ status: number; message: string }> {
    const hfApiUrl = this.configService.getOrThrow<string>('HF_API_URL');
    const response = await firstValueFrom(
      this.httpService.get(`${hfApiUrl}/is-up`),
    );

    if (response.status >= 400) {
      return { message: 'ASR service is down!', status: response.status };
    }

    return { message: 'ASR service is up', status: response.status };
  }

  async transcribeAudio(
    transcribeAudioInternalDto: TranscribeAudioInternalDto,
  ): Promise<{ transcription: string }> {
    try {
      const fileStream = fs.createReadStream(
        transcribeAudioInternalDto.filePath,
      );
      const formData = new FormData();
      formData.append('files', fileStream);
      const apiUrl = this.configService.getOrThrow<string>('API_URL');

      const response = await firstValueFrom(
        this.httpService.post<{ transcription: string }>(apiUrl, formData, {
          headers: {
            ...formData.getHeaders(),
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to transcribe audio at path: ${transcribeAudioInternalDto.filePath.toString()}`,
        error instanceof Error ? error.message : String(error),
      );
      throw new RpcException(
        new ErrorResponse(
          'Internal server error during transcribing audio',
          500,
        ),
      );
    }
  }

  async deleteTemporaryFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
      this.logger.log(`Successfully deleted temporary file: ${filePath}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete temporary file: ${filePath}`,
        error instanceof Error ? error.message : String(error),
      );
      throw new RpcException(
        new ErrorResponse(
          'Internal server error during deleteing temporary file',
          500,
        ),
      );
    }
  }
}
