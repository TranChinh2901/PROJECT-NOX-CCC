import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, Unique, OneToMany } from "typeorm";
import { User } from "@/modules/users/entity/user.entity";
import { WishlistItem } from "./wishlist-item";

@Entity('wishlists')
@Index(['user_id'])
@Unique(['share_token'])
export class Wishlist {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user_id!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ length: 255 })
  name!: string;

  @Column({ default: false })
  is_default!: boolean;

  @Column({ default: false })
  is_public!: boolean;

  @Column({ length: 255, nullable: true })
  share_token?: string;

  @OneToMany(() => WishlistItem, item => item.wishlist)
  items!: WishlistItem[];

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;
}
