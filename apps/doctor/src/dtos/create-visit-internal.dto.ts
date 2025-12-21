import { IsInt, IsPositive } from 'class-validator';
import { CreateVisitDto } from './create-visit.dto';

export class CreateVisitInternalDto extends CreateVisitDto {
  @IsInt()
  @IsPositive()
  readonly doctorUserId: number;

  constructor(createVisitDto: CreateVisitDto, doctorUserId: number) {
    super();
    Object.assign(this, createVisitDto);
    this.doctorUserId = doctorUserId;
  }
}
