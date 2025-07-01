// Generic Page Response for the employee search
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
} 