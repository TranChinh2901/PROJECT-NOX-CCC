import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from "typeorm";
import { User } from "@/modules/users/entity/user.entity";
import { Cart } from "@/modules/cart/entity/cart";
import { OrderItem } from "./order-item";
import { OrderStatusHistory } from "./order-status-history";
import { OrderStatus, PaymentStatus, PaymentMethod } from "../enum/order.enum";

@Entity('orders')
@Index(['user_id'])
@Index(['status'])
@Index(['payment_status'])
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 20, unique: true })
  order_number!: string;

  @Column()
  user_id!: number;

  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'int', nullable: true })
  cart_id?: number;

  @ManyToOne(() => Cart, cart => cart.id, { nullable: true })
  @JoinColumn({ name: 'cart_id' })
  cart?: Cart;

  @Column({ 
    type: 'enum', 
    enum: OrderStatus, 
    default: OrderStatus.PENDING 
  })
  status!: OrderStatus;

  @Column({ 
    type: 'enum', 
    enum: PaymentStatus, 
    default: PaymentStatus.PENDING 
  })
  payment_status!: PaymentStatus;

  @Column({ 
    type: 'enum', 
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

  @Column({ type: 'timestamp', nullable: true })
  shipped_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  delivered_at?: Date;

  @OneToMany(() => OrderItem, item => item.order)
  items?: OrderItem[];

  @OneToMany(() => OrderStatusHistory, history => history.order)
  status_histories?: OrderStatusHistory[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at?: Date;
}
