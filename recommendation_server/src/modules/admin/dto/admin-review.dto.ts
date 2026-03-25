import { PaginationQueryDto } from './pagination-query.dto';

export interface ReviewFilterQueryDto extends PaginationQueryDto {
  is_approved?: boolean;
  product_id?: number;
  user_id?: number;
  rating?: number;
}

export interface BulkApproveDto {
  ids: number[];
}
