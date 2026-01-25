import { Role, Roles } from '@app/common';
import {
  Controller,
  Get,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards';
import { OcrService } from './ocr.service';

@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Get()
  async isUp(): Promise<string> {
    return await this.ocrService.isUp();
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.DOCTOR)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @Post('process-id')
  async processIdCard(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(image\/jpeg|image\/jpg|image\/png|application\/pdf)$/,
        })
        .addMaxSizeValidator({
          maxSize: 5 * 1024 * 1024, // 5 MB,
        })
        .build(),
    )
    file: Express.Multer.File,
  ): Promise<{
    firstName: string;
    lastName: string;
    location: string;
    socialSecurityNumber: string;
  }> {
    return await this.ocrService.processIdCard(file);
  }
}
