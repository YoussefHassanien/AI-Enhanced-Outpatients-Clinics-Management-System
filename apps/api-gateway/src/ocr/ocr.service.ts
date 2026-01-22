import { Microservices, OcrPatterns } from '@app/common';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(
    @Inject(Microservices.OCR) private readonly ocrClient: ClientProxy,
  ) {}
  async isUp(): Promise<string> {
    return await lastValueFrom<string>(
      this.ocrClient.send<string>(OcrPatterns.IS_UP, {}),
    );
  }
  async processIdCard(file: Express.Multer.File): Promise<{
    firstName: string;
    lastName: string;
    location: string;
    socialSecurityNumber: string;
  }> {
    this.logger.log(
      `Processing Egyptian ID photo: ${file.originalname} (${file.size} bytes)`,
    );

    try {
      // Convert file buffer to base64
      const imageBase64 = file.buffer.toString('base64');

      // Send message to the 'ocr' queue
      // The Python consumer expects: { data: { image_base64: "..." } }
      const result = await lastValueFrom<
        | {
            firstName: string;
            lastName: string;
            location: string;
            socialSecurityNumber: string;
          }
        | {
            error: string;
          }
      >(
        this.ocrClient
          .send<
            | {
                firstName: string;
                lastName: string;
                location: string;
                socialSecurityNumber: string;
              }
            | {
                error: string;
              }
          >(
            {}, // Empty pattern - Python consumer doesn't use cmd patterns
            { image_base64: imageBase64 },
          )
          .pipe(
            timeout(60000), // 60 second timeout for OCR processing
          ),
      );

      // Check if OCR returned an error
      if ('error' in result) {
        this.logger.warn(`OCR processing failed: ${result.error}`);
        throw new BadRequestException(result.error);
      }

      this.logger.log('OCR processing completed successfully');
      return result;
    } catch (error: unknown) {
      // Re-throw BadRequestException as-is
      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`OCR service error: ${errorMessage}`, errorStack);
      throw new InternalServerErrorException(
        'Failed to process ID card. Please try again later.',
      );
    }
  }
}
