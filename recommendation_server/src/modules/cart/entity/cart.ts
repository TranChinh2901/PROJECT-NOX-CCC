import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, DeleteDateColumn, Index, Unique } from "typeorm";
import { User } from "@/modules/users/entity/user.entity";
import { CartItem } from "./cart-item";
import { CartStatus } from "../enum/cart.enum";

@Entity('carts')
@Unique('UQ_carts_guest_token', ['guest_token'])
@Index('IDX_carts_user_id', ['user_id'])
@Index('IDX_carts_guest_token', ['guest_token'])
@Index('IDX_carts_status', ['status'])
export class Cart {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: true })
  user_id?: number;

  @ManyToOne(() => User, user => user.id, { nullable: true, onDelete: 'SET NULL', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_carts_user' })
  user?: User;

  @Column({ type: 'varchar', length: 64, nullable: true })
  guest_token!: string | null;

  @Column({
    type: 'simple-enum',
    enum: CartStatus,
    default: CartStatus.ACTIVE
  })
  status!: CartStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_amount!: number;

  @Column({ type: 'int', default: 0 })
  item_count!: number;

  @Column({ length: 3, default: 'VND' })
  currency!: string;

  @Column({ type: 'datetime', precision: 0, nullable: true })
  expires_at?: Date;

  @OneToMany(() => CartItem, item => item.cart)
  items?: CartItem[];

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'datetime', precision: 0, nullable: true })
  deleted_at?: Date;
}
