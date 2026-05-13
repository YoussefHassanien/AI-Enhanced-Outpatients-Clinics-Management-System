import { IsOptional, IsString, IsUUID } from 'class-validator';
import { UpdateScanDto } from './update-scan.dto';

export class UpdateScanInternalDto extends UpdateScanDto {
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
    updateScanDto: UpdateScanDto,
    imageFilePath?: string,
    imageMimetype?: string,
    audioFilePath?: string,
    audioMimetype?: string,
  ) {
    super();
    Object.assign(this, updateScanDto);
    this.id = id;
    this.imageFilePath = imageFilePath;
    this.imageMimetype = imageMimetype;
    this.audioFilePath = audioFilePath;
    this.audioMimetype = audioMimetype;
  }
}
