import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, Unique } from "typeorm";
import { User } from "@/modules/users/entity/user.entity";
import { Product } from "@/modules/products/entity/product";
import { RecommendationType } from "../enum/recommendation.enum";

@Entity('recommendation_cache')
@Unique('UQ_recommendation_cache_cache_key', ['cache_key'])
@Index('IDX_recommendation_cache_user_id', ['user_id'])
@Index('IDX_recommendation_cache_product_id', ['product_id'])
@Index('IDX_recommendation_cache_recommendation_type', ['recommendation_type'])
@Index('IDX_recommendation_cache_expires_at', ['expires_at'])
@Index('IDX_recommendation_cache_is_active', ['is_active'])
export class RecommendationCache {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 191 })
  cache_key!: string;

  @Column({ type: 'int', nullable: true })
  user_id?: number;

  @ManyToOne(() => User, user => user.id, { nullable: true, onDelete: 'SET NULL', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_recommendation_cache_user' })
  user?: User;

  @Column({ type: 'int', nullable: true })
  product_id?: number;

  @ManyToOne(() => Product, product => product.id, { nullable: true, onDelete: 'SET NULL', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'product_id', foreignKeyConstraintName: 'FK_recommendation_cache_product' })
  product?: Product;

  @Column({ type: 'simple-enum', enum: RecommendationType })
  recommendation_type!: RecommendationType;

  @Column({ length: 50, default: 'third_party' })
  algorithm!: string;

  @Column({ type: 'json' })
  recommended_products!: object[];

  @Column({ type: 'json', nullable: true })
  context_data?: object;

  @Column({ type: 'datetime' })
  expires_at!: Date;

  @Column({ type: 'datetime' })
  generated_at!: Date;

  @Column({ type: 'int', default: 0 })
  cache_hit_count!: number;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at!: Date;
}
