import { IsOptional, IsString, IsUUID } from 'class-validator';
import { UpdateVisitDto } from './update-visit.dto';

export class UpdateVisitInternalDto extends UpdateVisitDto {
  @IsUUID()
  readonly id: string;

  @IsString()
  @IsOptional()
  audioFilePath?: string;

  @IsString()
  @IsOptional()
  audioMimetype?: string;

  constructor(
    id: string,
    updateVisitDto: UpdateVisitDto,
    audioFilePath?: string,
    audioMimetype?: string,
  ) {
    super();
    Object.assign(this, updateVisitDto);
    this.id = id;
    this.audioFilePath = audioFilePath;
    this.audioMimetype = audioMimetype;
  }
}
