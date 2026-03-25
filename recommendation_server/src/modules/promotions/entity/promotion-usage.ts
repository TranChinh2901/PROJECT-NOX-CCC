import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Index } from "typeorm";
import { Promotion } from "./promotion";
import { Order } from "@/modules/orders/entity/order";
import { User } from "@/modules/users/entity/user.entity";

@Entity('promotion_usage')
@Index('IDX_promotion_usage_promotion_id', ['promotion_id'])
@Index('IDX_promotion_usage_order_id', ['order_id'])
@Index('IDX_promotion_usage_user_id', ['user_id'])
export class PromotionUsage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  promotion_id!: number;

  @ManyToOne(() => Promotion, promotion => promotion.usages, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'promotion_id', foreignKeyConstraintName: 'FK_promotion_usage_promotion' })
  promotion!: Promotion;

  @Column()
  order_id!: number;

  @ManyToOne(() => Order, order => order.id, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'order_id', foreignKeyConstraintName: 'FK_promotion_usage_order' })
  order!: Order;

  @Column()
  user_id!: number;

  @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_promotion_usage_user' })
  user!: User;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discount_amount!: number;

  @Column({ type: 'datetime', precision: 0 })
  used_at!: Date;
}
