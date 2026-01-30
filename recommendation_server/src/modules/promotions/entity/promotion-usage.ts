import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Index } from "typeorm";
import { Promotion } from "./promotion";
import { Order } from "@/modules/orders/entity/order";
import { User } from "@/modules/users/entity/user.entity";

@Entity('promotion_usage')
@Index(['promotion_id'])
@Index(['order_id'])
@Index(['user_id'])
export class PromotionUsage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  promotion_id!: number;

  @ManyToOne(() => Promotion, promotion => promotion.usages)
  @JoinColumn({ name: 'promotion_id' })
  promotion!: Promotion;

  @Column()
  order_id!: number;

  @ManyToOne(() => Order, order => order.id)
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column()
  user_id!: number;

  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discount_amount!: number;

  @Column({ type: 'timestamp' })
  used_at!: Date;
}
