import { Role, Roles } from '@app/common';
import {
  Controller,
  Get,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../auth/guards';
import { AsrService } from './asr.service';

@Controller('asr')
export class AsrController {
  constructor(private readonly asrService: AsrService) {}

  @Get()
  async isUp(@Res() res: Response) {
    return await this.asrService.isUp(res);
  }

  @Post('transcribe')
  @Roles(Role.DOCTOR, Role.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: process.env.ASR_TMP_DIR,
        filename: (req, file, cb) => {
          const randomName = uuidv4();
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async transcribe(@UploadedFile() file: Express.Multer.File) {
    return await this.asrService.transcribe(file);
  }
}
