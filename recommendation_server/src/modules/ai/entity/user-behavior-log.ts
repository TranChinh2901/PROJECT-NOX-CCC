import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { UserSession } from "@/modules/users/entity/user-session";
import { User } from "@/modules/users/entity/user.entity";
import { Product } from "@/modules/products/entity/product";
import { ProductVariant } from "@/modules/products/entity/product-variant";
import { UserActionType } from "../enum/user-behavior.enum";
import { DeviceType } from "@/modules/users/enum/user-session.enum";

@Entity('user_behavior_logs')
@Index('IDX_user_behavior_logs_session_created_at', ['session_id', 'created_at'])
@Index('IDX_user_behavior_logs_user_id', ['user_id'])
@Index('IDX_user_behavior_logs_action_type', ['action_type'])
@Index('IDX_user_behavior_logs_product_id', ['product_id'])
@Index('IDX_user_behavior_logs_variant_id', ['variant_id'])
export class UserBehaviorLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  session_id!: number;

  @ManyToOne(() => UserSession, session => session.id, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'session_id', foreignKeyConstraintName: 'FK_user_behavior_logs_session' })
  session!: UserSession;

  @Column({ type: 'int', nullable: true })
  user_id?: number;

  @ManyToOne(() => User, user => user.id, { nullable: true, onDelete: 'SET NULL', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_user_behavior_logs_user' })
  user?: User;

  @Column({ type: 'simple-enum', enum: UserActionType })
  action_type!: UserActionType;

  @Column({ type: 'int', nullable: true })
  product_id?: number;

  @ManyToOne(() => Product, product => product.id, { nullable: true, onDelete: 'SET NULL', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'product_id', foreignKeyConstraintName: 'FK_user_behavior_logs_product' })
  product?: Product;

  @Column({ type: 'int', nullable: true })
  variant_id?: number;

  @ManyToOne(() => ProductVariant, variant => variant.id, { nullable: true, onDelete: 'SET NULL', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'variant_id', foreignKeyConstraintName: 'FK_user_behavior_logs_variant' })
  variant?: ProductVariant;

  @Column({ length: 255, nullable: true })
  search_query?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: object;

  @Column({ type: 'simple-enum', enum: DeviceType })
  device_type!: DeviceType;

  @Column({ length: 500, nullable: true })
  referrer_url?: string;

  @Column({ length: 500 })
  page_url!: string;

  @Column({ length: 45, nullable: true })
  ip_address?: string;

  @Column({ type: 'int', nullable: true })
  session_duration_seconds?: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}
