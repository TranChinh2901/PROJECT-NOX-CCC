import { ProductVariant, PaymentStatus, PaymentMethod } from './product.types';
import { User } from './auth.types';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum CartStatus {
  ACTIVE = 'active',
  CONVERTED = 'converted',
  ABANDONED = 'abandoned'
}

export interface Address {
  fullname: string;
  phone: string;
  address: string;
  city: string;
  district?: string;
  ward?: string;
  postal_code?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  variant_id: number;
  variant?: ProductVariant;
  product_snapshot: object;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  user?: User;
  cart_id?: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  shipping_address: Address;
  billing_address: Address;
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  notes?: string;
  internal_notes?: string;
  tracking_number?: string;
  shipped_at?: Date;
  delivered_at?: Date;
  items?: OrderItem[];
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface CreateOrderDto {
  cart_id: number;
  shipping_address: Address;
  billing_address: Address;
  payment_method: PaymentMethod;
  notes?: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  user_id?: number;
  from_date?: Date;
  to_date?: Date;
  page?: number;
  limit?: number;
}
