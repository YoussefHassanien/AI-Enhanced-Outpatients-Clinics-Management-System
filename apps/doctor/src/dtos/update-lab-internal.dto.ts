import { IsOptional, IsString, IsUUID } from 'class-validator';
import { UpdateLabDto } from './update-lab.dto';

export class UpdateLabInternalDto extends UpdateLabDto {
  @IsUUID()
  readonly id: string;

  @IsString()
  @IsOptional()
  imageFilePath?: string;

  @IsString()
  @IsOptional()
  imageMimetype?: string;

  @IsString()
  @IsOptional()
  audioFilePath?: string;

  @IsString()
  @IsOptional()
  audioMimetype?: string;

  constructor(
    id: string,
    updateLabDto: UpdateLabDto,
    imageFilePath?: string,
    imageMimetype?: string,
    audioFilePath?: string,
    audioMimetype?: string,
  ) {
    super();
    Object.assign(this, updateLabDto);
    this.id = id;
    this.imageFilePath = imageFilePath;
    this.imageMimetype = imageMimetype;
    this.audioFilePath = audioFilePath;
    this.audioMimetype = audioMimetype;
  }
}
