import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, DeleteDateColumn, Index, Unique } from "typeorm";
import { User } from "@/modules/users/entity/user.entity";
import { Cart } from "@/modules/cart/entity/cart";
import { OrderItem } from "./order-item";
import { OrderStatusHistory } from "./order-status-history";
import { OrderStatus, PaymentStatus, PaymentMethod } from "../enum/order.enum";

@Entity('orders')
@Unique('UQ_orders_order_number', ['order_number'])
@Index('IDX_orders_user_id', ['user_id'])
@Index('IDX_orders_cart_id', ['cart_id'])
@Index('IDX_orders_status', ['status'])
@Index('IDX_orders_payment_status', ['payment_status'])
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 20 })
  order_number!: string;

  @Column()
  user_id!: number;

  @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_orders_user' })
  user!: User;

  @Column({ type: 'int', nullable: true })
  cart_id?: number;

  @ManyToOne(() => Cart, cart => cart.id, { nullable: true, onDelete: 'SET NULL', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'cart_id', foreignKeyConstraintName: 'FK_orders_cart' })
  cart?: Cart;

  @Column({
    type: 'simple-enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING
  })
  status!: OrderStatus;

  @Column({
    type: 'simple-enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  payment_status!: PaymentStatus;

  @Column({
    type: 'simple-enum',
    enum: PaymentMethod
  })
  payment_method!: PaymentMethod;

  @Column({ type: 'json' })
  shipping_address!: object;

  @Column({ type: 'json' })
  billing_address!: object;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount_amount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shipping_amount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax_amount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount!: number;

  @Column({ length: 3, default: 'VND' })
  currency!: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  internal_notes?: string;

  @Column({ length: 100, nullable: true })
  tracking_number?: string;

  @Column({ type: 'datetime', precision: 0, nullable: true })
  shipped_at?: Date;

  @Column({ type: 'datetime', precision: 0, nullable: true })
  delivered_at?: Date;

  @OneToMany(() => OrderItem, item => item.order)
  items?: OrderItem[];

  @OneToMany(() => OrderStatusHistory, history => history.order)
  status_histories?: OrderStatusHistory[];

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'datetime', precision: 0, nullable: true })
  deleted_at?: Date;
}
