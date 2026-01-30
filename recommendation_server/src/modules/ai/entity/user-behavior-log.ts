import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Index } from "typeorm";
import { UserSession } from "@/modules/users/entity/user-session";
import { User } from "@/modules/users/entity/user.entity";
import { Product } from "@/modules/products/entity/product";
import { ProductVariant } from "@/modules/products/entity/product-variant";
import { UserActionType } from "../enum/user-behavior.enum";
import { DeviceType } from "@/modules/users/enum/user-session.enum";

@Entity('user_behavior_logs')
@Index(['session_id', 'created_at'])
@Index(['user_id'])
@Index(['action_type'])
@Index(['product_id'])
export class UserBehaviorLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  session_id!: number;

  @ManyToOne(() => UserSession, session => session.id)
  @JoinColumn({ name: 'session_id' })
  session!: UserSession;

  @Column({ type: 'int', nullable: true })
  user_id?: number;

  @ManyToOne(() => User, user => user.id, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'enum', enum: UserActionType })
  action_type!: UserActionType;

  @Column({ type: 'int', nullable: true })
  product_id?: number;

  @ManyToOne(() => Product, product => product.id, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @Column({ type: 'int', nullable: true })
  variant_id?: number;

  @ManyToOne(() => ProductVariant, variant => variant.id, { nullable: true })
  @JoinColumn({ name: 'variant_id' })
  variant?: ProductVariant;

  @Column({ length: 255, nullable: true })
  search_query?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: object;

  @Column({ type: 'enum', enum: DeviceType })
  device_type!: DeviceType;

  @Column({ length: 500, nullable: true })
  referrer_url?: string;

  @Column({ length: 500 })
  page_url!: string;

  @Column({ length: 45, nullable: true })
  ip_address?: string;

  @Column({ type: 'int', nullable: true })
  session_duration_seconds?: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;
}
