import { IsString } from 'class-validator';
import { PathLike } from 'fs';

export class TranscribeAudioInternalDto {
  @IsString()
  filePath: PathLike;
}
