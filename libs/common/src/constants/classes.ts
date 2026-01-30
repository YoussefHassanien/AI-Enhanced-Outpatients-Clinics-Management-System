import { IsInt, IsNotEmpty, IsPositive, Max, Min } from 'class-validator';

export class ErrorResponse {
  @IsNotEmpty()
  public message: string;

  @IsInt()
  @Min(400)
  @Max(511)
  public status: number;

  constructor(message: string, status: number) {
    this.message = message;
    this.status = status;
  }
}

export class PaginationResponse<T> {
  @IsInt()
  @IsPositive()
  page: number;

  items: T[];

  @IsInt()
  totalItems: number;

  @IsInt()
  @IsPositive()
  totalPages: number;
}

export class PaginationRequest {
  @IsInt()
  @IsPositive()
  limit: number;

  @IsInt()
  @IsPositive()
  page: number;
}
