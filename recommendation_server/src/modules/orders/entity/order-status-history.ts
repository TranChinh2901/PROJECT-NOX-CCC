import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Index } from "typeorm";
import { OrderStatus } from "../enum/order.enum";
import { Order } from "./order";

@Entity('order_status_histories')
@Index(['order_id'])
export class OrderStatusHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  order_id!: number;

  @ManyToOne(() => Order, (order) => order.status_histories)
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ type: 'enum', enum: OrderStatus })
  status!: OrderStatus;

  @Column({ type: 'enum', enum: OrderStatus, nullable: true })
  previous_status?: OrderStatus;

  @Column({ length: 100, nullable: true })
  changed_by?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;
}
