import { PaginationQueryDto } from './pagination-query.dto';
import { OrderStatus, PaymentStatus } from '@/modules/orders/enum/order.enum';

export interface OrderFilterQueryDto extends PaginationQueryDto {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  user_id?: number;
  start_date?: string;
  end_date?: string;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  notes?: string;
}

export interface AddInternalNoteDto {
  note: string;
}
