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

  totalItems: number;

  totalPages: number;

  constructor(
    page: number,
    items: T[],
    totatItems: number,
    totalPages: number,
  ) {
    this.items = items;
    this.page = page;
    this.totalItems = totatItems;
    this.totalPages = totalPages;
  }
}

export class PaginationRequest {
  @IsInt()
  @IsPositive()
  limit: number;

  @IsInt()
  @IsPositive()
  page: number;

  constructor(page: number, limit: number) {
    this.limit = limit;
    this.page = page;
  }
}
