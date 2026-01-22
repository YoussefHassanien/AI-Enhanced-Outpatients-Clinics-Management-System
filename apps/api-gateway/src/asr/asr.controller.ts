import { Role, Roles } from '@app/common';
import {
  BadRequestException,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../auth/guards';
import { AsrService } from './asr.service';

@Controller('asr')
export class AsrController {
  constructor(private readonly asrService: AsrService) {}

  @Get()
  async isUp() {
    return await this.asrService.isUp();
  }

  @Get('whisper')
  async isReady() {
    return await this.asrService.isReady();
  }

  @Post('transcribe')
  @Roles(Role.DOCTOR)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: process.env.ASR_TMP_DIR || './tmp/asr_uploads',
        filename: (req, file, cb) => {
          const randomName = uuidv4();
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (
          !file.mimetype.startsWith('audio/') &&
          !file.mimetype.startsWith('video/')
        ) {
          return cb(
            new BadRequestException(
              'Invalid file type. Only audio and video files are allowed.',
            ),
            false,
          );
        }
        if (file.size > 20 * 1024 * 1024) {
          // 20MB
          return cb(
            new BadRequestException('File size exceeds 20MB limit.'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async transcribe(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required.');
    }
    return this.asrService.transcribe(file.path);
  }
}
