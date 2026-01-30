import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from "typeorm";
import { User } from "@/modules/users/entity/user.entity";
import { UserSession } from "@/modules/users/entity/user-session";
import { CartItem } from "./cart-item";
import { CartStatus } from "../enum/cart.enum";

@Entity('carts')
@Index(['user_id'])
@Index(['session_id'])
@Index(['status'])
export class Cart {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: true })
  user_id?: number;

  @ManyToOne(() => User, user => user.id, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'int', nullable: true })
  session_id?: number;

  @ManyToOne(() => UserSession, session => session.id, { nullable: true })
  @JoinColumn({ name: 'session_id' })
  session?: UserSession;

  @Column({ 
    type: 'enum', 
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

  @Column({ type: 'timestamp', nullable: true })
  expires_at?: Date;

  @OneToMany(() => CartItem, item => item.cart)
  items?: CartItem[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at?: Date;
}
