import { Controller, Get, Res } from '@nestjs/common';
import { AsrService } from './asr.service';
import { Response } from 'express';

@Controller('asr')
export class AsrController {
  constructor(private readonly asrService: AsrService) {}

  @Get()
  async isUp(@Res() res: Response) {
    return await this.asrService.isUp(res);
  }
}
