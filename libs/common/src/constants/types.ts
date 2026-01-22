export type PaginationResponse<T> = {
  page: number;
  items: T[];
  totalItems: number;
  totalPages: number;
};

export type PaginationRequest = {
  limit: number;
  page: number;
};
