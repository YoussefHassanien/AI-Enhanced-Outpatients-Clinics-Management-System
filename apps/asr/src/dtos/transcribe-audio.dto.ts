import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TranscribeAudioDto {
  @ApiProperty({
    description: 'The path to the audio file to be transcribed.',
    example: '/tmp/audio1.wav',
  })
  @IsString()
  file: string;
}
