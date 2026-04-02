import {
  IsInt,
  IsMimeType,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { CreateVisitDto } from './create-visit.dto';

export class CreateVisitInternalDto extends CreateVisitDto {
  @IsInt()
  @IsPositive()
  readonly doctorUserId: number;

  @IsString()
  @IsOptional()
  readonly audioFilePath?: string;

  @IsMimeType()
  @IsOptional()
  readonly audioMimetype?: string;

  constructor(
    createVisitDto: CreateVisitDto,
    doctorUserId: number,
    audioFilePath?: string,
    audioMimetype?: string,
  ) {
    super();
    Object.assign(this, createVisitDto);
    this.doctorUserId = doctorUserId;
    this.audioFilePath = audioFilePath;
    this.audioMimetype = audioMimetype;
  }
}
