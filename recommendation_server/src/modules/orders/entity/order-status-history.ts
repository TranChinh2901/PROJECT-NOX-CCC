import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Index } from "typeorm";
import { OrderStatus } from "../enum/order.enum";
import { Order } from "./order";
import { User } from "@/modules/users/entity/user.entity";

@Entity('order_status_histories')
@Index(['order_id'])
export class OrderStatusHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  order_id!: number;

  @ManyToOne(() => Order, (order) => order.status_histories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ type: 'simple-enum', enum: OrderStatus })
  status!: OrderStatus;

  @Column({ type: 'simple-enum', enum: OrderStatus, nullable: true })
  previous_status?: OrderStatus;

  @Column({ nullable: true })
  changed_by_user_id!: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'changed_by_user_id' })
  changed_by_user!: User | null;

  changed_by?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;
}
