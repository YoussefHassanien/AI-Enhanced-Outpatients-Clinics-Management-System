import { CommonServices, LoggingService } from '@app/common';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import FormData from 'form-data';
import * as fs from 'fs';
import { firstValueFrom } from 'rxjs';
import { TranscribeAudioDto } from './dtos';

@Injectable()
export class AsrService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CommonServices.LOGGING)
    private readonly logger: LoggingService,
  ) {}

  isUp(): string {
    return 'ASR service is up';
  }

  async isReady(): Promise<{ service: string; status: string }> {
    const hfApiUrl = this.configService.getOrThrow<string>('HF_API_URL');
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${hfApiUrl}/is-up`),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        'HuggingFace Whisper API is not reachable',
        error.stack,
      );
      return {
        service: 'Whisper-FastAPI',
        status: 'DOWN',
      };
    }
  }

  async transcribe(data: TranscribeAudioDto) {
    const filePath = data.file;
    try {
      const result = await this.processFile(filePath);
      return result;
    } catch (error) {
      this.logger.error(`Failed to process file ${filePath}:`, error.stack);
      throw error; // Re-throw the error to be handled by the controller
    } finally {
      // Clean up the file after processing
      fs.unlink(filePath, (err) => {
        if (err) {
          this.logger.error(
            `Failed to delete temporary file ${filePath}:`,
            err.stack,
          );
        }
      });
    }
  }

  private async processFile(filePath: string) {
    this.validateFile(filePath);

    const fileStream = fs.createReadStream(filePath);
    const formData = new FormData();
    formData.append('files', fileStream);

    const apiUrl = this.configService.getOrThrow<string>('API_URL');

    try {
      const response = await firstValueFrom(
        this.httpService.post(apiUrl, formData, {
          headers: {
            ...formData.getHeaders(),
          },
        }),
      );
      return response.data;
    } catch (error) {
      throw new RpcException(
        `Error transcribing file: ${error.response?.status} - ${error.response?.data || error.message}`,
      );
    }
  }

  private validateFile(filePath: string) {
    if (!fs.existsSync(filePath)) {
      throw new RpcException(`File not found at path: ${filePath}`);
    }
  }
}
