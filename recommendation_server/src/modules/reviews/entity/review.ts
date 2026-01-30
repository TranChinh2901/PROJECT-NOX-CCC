import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from "typeorm";
import { User } from "@/modules/users/entity/user.entity";
import { Product } from "@/modules/products/entity/product";
import { OrderItem } from "@/modules/orders/entity/order-item";
import { ReviewHelpful } from "./review-helpful";

@Entity('reviews')
@Index(['product_id'])
@Index(['user_id'])
@Index(['rating'])
@Index(['is_approved'])
export class Review {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  product_id!: number;

  @ManyToOne(() => Product, product => product.id)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column()
  user_id!: number;

  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column()
  order_item_id!: number;

  @ManyToOne(() => OrderItem, item => item.id)
  @JoinColumn({ name: 'order_item_id' })
  order_item!: OrderItem;

  @Column({ type: 'int' })
  rating!: number;

  @Column({ length: 200, nullable: true })
  title?: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'boolean', default: false })
  is_verified_purchase!: boolean;

  @Column({ type: 'boolean', default: false })
  is_approved!: boolean;

  @Column({ type: 'int', default: 0 })
  helpful_count!: number;

  @Column({ type: 'int', default: 0 })
  not_helpful_count!: number;

  @OneToMany(() => ReviewHelpful, helpful => helpful.review)
  helpful_votes?: ReviewHelpful[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at?: Date;
}
