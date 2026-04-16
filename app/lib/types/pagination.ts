export interface PaginationMeta {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextCursor: string | null;
  previousCursor: string | null;
  limit: number;
}

export interface PaginationResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
