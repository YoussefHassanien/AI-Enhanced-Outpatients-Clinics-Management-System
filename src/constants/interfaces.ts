export interface PaginationResponse<T> {
  page: number;
  items: T[];
  totalItems: number;
  totalPages: number;
}
