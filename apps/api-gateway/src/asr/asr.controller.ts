import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AsrService } from './asr.service';
import { Express } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';

@Controller('asr')
export class AsrController {
  constructor(private readonly asrService: AsrService) { }

  @Post('transcribe')
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
        if (!file.mimetype.startsWith('audio/') && !file.mimetype.startsWith('video/')) {
          return cb(new BadRequestException('Invalid file type. Only audio and video files are allowed.'), false);
        }
        if (file.size > 20 * 1024 * 1024) { // 20MB
          return cb(new BadRequestException('File size exceeds 20MB limit.'), false);
        }
        cb(null, true);
      },
    }),
  )
  //for swagger documentation
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Audio file to transcribe',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async transcribe(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required.');
    }
    return this.asrService.transcribe(file.path);
  }
}
