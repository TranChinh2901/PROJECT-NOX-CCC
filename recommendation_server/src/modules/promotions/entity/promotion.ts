import { Entity, Column, PrimaryGeneratedColumn, OneToMany, DeleteDateColumn, Index, Unique } from "typeorm";
import { PromotionUsage } from "./promotion-usage";
import { PromotionType, PromotionAppliesTo } from "../enum/promotion.enum";

@Entity('promotions')
@Unique('UQ_promotions_code', ['code'])
@Index('IDX_promotions_is_active', ['is_active'])
@Index('IDX_promotions_starts_at', ['starts_at'])
@Index('IDX_promotions_ends_at', ['ends_at'])
export class Promotion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 50 })
  code!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'simple-enum', enum: PromotionType })
  type!: PromotionType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  min_order_amount?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  max_discount_amount?: number;

  @Column({ type: 'int', nullable: true })
  usage_limit?: number;

  @Column({ type: 'int', nullable: true })
  usage_limit_per_user?: number;

  @Column({ type: 'datetime', precision: 0, nullable: true })
  starts_at?: Date;

  @Column({ type: 'datetime', precision: 0, nullable: true })
  ends_at?: Date;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'simple-enum', enum: PromotionAppliesTo, default: PromotionAppliesTo.ALL })
  applies_to!: PromotionAppliesTo;

  @Column({ type: 'json', nullable: true })
  applicable_ids?: number[];

  @OneToMany(() => PromotionUsage, usage => usage.promotion)
  usages?: PromotionUsage[];

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'datetime', precision: 0, nullable: true })
  deleted_at?: Date;
}
