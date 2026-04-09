import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, DeleteDateColumn, Index } from "typeorm";
import { User } from "@/modules/users/entity/user.entity";
import { Product } from "@/modules/products/entity/product";
import { OrderItem } from "@/modules/orders/entity/order-item";
import { ReviewHelpful } from "./review-helpful";

@Entity('reviews')
@Index('IDX_reviews_product_id', ['product_id'])
@Index('IDX_reviews_user_id', ['user_id'])
@Index('IDX_reviews_order_item_id', ['order_item_id'])
@Index('IDX_reviews_rating', ['rating'])
@Index('IDX_reviews_is_approved', ['is_approved'])
export class Review {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  product_id!: number;

  @ManyToOne(() => Product, product => product.reviews, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'product_id', foreignKeyConstraintName: 'FK_reviews_product' })
  product!: Product;

  @Column()
  user_id!: number;

  @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_reviews_user' })
  user!: User;

  @Column({ nullable: true })
  order_item_id!: number | null;

  @ManyToOne(() => OrderItem, item => item.id, { nullable: true, onDelete: 'SET NULL', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'order_item_id', foreignKeyConstraintName: 'FK_reviews_order_item' })
  order_item!: OrderItem | null;

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

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'datetime', precision: 0, nullable: true })
  deleted_at?: Date;
}
