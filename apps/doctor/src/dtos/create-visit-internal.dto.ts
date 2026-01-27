import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';
import { CreateVisitDto } from './create-visit.dto';

export class CreateVisitInternalDto extends CreateVisitDto {
  @IsInt()
  @IsPositive()
  readonly doctorUserId: number;

  @IsString()
  @IsNotEmpty()
  readonly audioBase64?: string;

  @IsString()
  @IsNotEmpty()
  readonly audioMimetype?: string;

  constructor(
    createVisitDto: CreateVisitDto,
    doctorUserId: number,
    audioBase64?: string,
    audioMimetype?: string,
  ) {
    super();
    Object.assign(this, createVisitDto);
    this.doctorUserId = doctorUserId;
    this.audioBase64 = audioBase64;
    this.audioMimetype = audioMimetype;
  }
}
