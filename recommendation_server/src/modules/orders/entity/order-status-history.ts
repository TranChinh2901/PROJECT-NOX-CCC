import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { OrderStatus } from "../enum/order.enum";
import { Order } from "./order";

@Entity('order_status_histories')
@Index('IDX_order_status_histories_order_id', ['order_id'])
export class OrderStatusHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  order_id!: number;

  @ManyToOne(() => Order, (order) => order.status_histories, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'order_id', foreignKeyConstraintName: 'FK_order_status_histories_order' })
  order!: Order;

  @Column({ type: 'simple-enum', enum: OrderStatus })
  status!: OrderStatus;

  @Column({ type: 'simple-enum', enum: OrderStatus, nullable: true })
  previous_status?: OrderStatus;

  @Column({ length: 100, nullable: true })
  changed_by?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}
