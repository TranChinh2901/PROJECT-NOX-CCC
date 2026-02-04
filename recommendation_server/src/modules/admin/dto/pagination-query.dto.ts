export interface PaginationQueryDto {
  page?: number; // default: 1
  limit?: number; // default: 10
  sortBy?: string; // field name
  sortOrder?: 'ASC' | 'DESC'; // default: DESC
  search?: string; // optional search term
}
