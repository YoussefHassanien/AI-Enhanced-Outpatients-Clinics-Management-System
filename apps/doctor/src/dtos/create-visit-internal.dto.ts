import { CreateVisitDto } from './create-visit.dto';

export class CreateVisitInternalDto extends CreateVisitDto {
  readonly doctorUserId: number;

  constructor(createVisitDto: CreateVisitDto, doctorUserId: number) {
    super();
    Object.assign(this, createVisitDto);
    this.doctorUserId = doctorUserId;
  }
}
