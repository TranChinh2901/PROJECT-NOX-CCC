import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from "typeorm";
import { User } from "@/modules/users/entity/user.entity";
import { UserSession } from "@/modules/users/entity/user-session";
import { CartItem } from "./cart-item";
import { CartStatus } from "../enum/cart.enum";

@Entity('carts')
@Index(['user_id'])
@Index(['guest_token'])
@Index(['status'])
export class Cart {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: true })
  user_id?: number;

  @ManyToOne(() => User, user => user.id, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'varchar', length: 64, nullable: true, unique: true })
  guest_token!: string | null;

  session_id?: number;

  session?: UserSession;

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

  @Column({ type: 'datetime', nullable: true })
  expires_at?: Date;

  @OneToMany(() => CartItem, item => item.cart)
  items?: CartItem[];

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deleted_at?: Date;
}
