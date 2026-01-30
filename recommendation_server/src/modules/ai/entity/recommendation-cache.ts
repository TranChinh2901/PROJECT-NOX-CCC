import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from "typeorm";
import { User } from "@/modules/users/entity/user.entity";
import { Product } from "@/modules/products/entity/product";
import { RecommendationType } from "../enum/recommendation.enum";

@Entity('recommendation_cache')
@Unique(['user_id', 'product_id', 'recommendation_type'])
@Index(['user_id'])
@Index(['product_id'])
@Index(['recommendation_type'])
@Index(['expires_at'])
@Index(['is_active'])
export class RecommendationCache {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: true })
  user_id?: number;

  @ManyToOne(() => User, user => user.id, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'int', nullable: true })
  product_id?: number;

  @ManyToOne(() => Product, product => product.id, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @Column({ type: 'enum', enum: RecommendationType })
  recommendation_type!: RecommendationType;

  @Column({ length: 50, default: 'third_party' })
  algorithm!: string;

  @Column({ type: 'json' })
  recommended_products!: object[];

  @Column({ type: 'json', nullable: true })
  context_data?: object;

  @Column({ type: 'timestamp' })
  expires_at!: Date;

  @Column({ type: 'timestamp' })
  generated_at!: Date;

  @Column({ type: 'int', default: 0 })
  cache_hit_count!: number;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;
}
