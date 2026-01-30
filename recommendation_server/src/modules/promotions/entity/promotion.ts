import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from "typeorm";
import { PromotionUsage } from "./promotion-usage";
import { PromotionType, PromotionAppliesTo } from "../enum/promotion.enum";

@Entity('promotions')
@Index(['is_active'])
@Index(['starts_at'])
@Index(['ends_at'])
export class Promotion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 50, unique: true })
  code!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: PromotionType })
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

  @Column({ type: 'timestamp', nullable: true })
  starts_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  ends_at?: Date;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'enum', enum: PromotionAppliesTo, default: PromotionAppliesTo.ALL })
  applies_to!: PromotionAppliesTo;

  @Column({ type: 'json', nullable: true })
  applicable_ids?: number[];

  @OneToMany(() => PromotionUsage, usage => usage.promotion)
  usages?: PromotionUsage[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at?: Date;
}
