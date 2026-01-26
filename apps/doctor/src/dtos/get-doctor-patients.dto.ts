import { IsNumber, IsOptional, Min } from 'class-validator';

export class GetDoctorPatientsDto {
    @IsNumber()
    doctorUserId: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @IsNumber()
    @Min(1)
    limit?: number = 10;
}