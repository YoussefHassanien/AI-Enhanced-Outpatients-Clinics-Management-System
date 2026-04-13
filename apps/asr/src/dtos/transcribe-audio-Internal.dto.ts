import { IsOptional, IsString } from 'class-validator';
import { PathLike } from 'fs';

export class TranscribeAudioInternalDto {
  @IsOptional()
  @IsString()
  filePath?: PathLike;

  @IsOptional()
  @IsString()
  audio_base64?: string;
}
