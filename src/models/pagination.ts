export interface PageRequest {
  limit: number;
  cursor?: string;
}

export interface Page<T> {
  data: T[];
  nextCursor: string | null;
}
