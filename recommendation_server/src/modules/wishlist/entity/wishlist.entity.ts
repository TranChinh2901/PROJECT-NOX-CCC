import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, Unique, OneToMany } from "typeorm";
import { User } from "@/modules/users/entity/user.entity";
import { WishlistItem } from "./wishlist-item";

@Entity('wishlists')
@Index('IDX_wishlists_user_id', ['user_id'])
@Unique('UQ_wishlists_share_token', ['share_token'])
export class Wishlist {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user_id!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_wishlists_user' })
  user!: User;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'boolean', default: false })
  is_default!: boolean;

  @Column({ type: 'boolean', default: false })
  is_public!: boolean;

  @Column({ length: 255, nullable: true })
  share_token?: string;

  @OneToMany(() => WishlistItem, item => item.wishlist)
  items!: WishlistItem[];

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at!: Date;
}
