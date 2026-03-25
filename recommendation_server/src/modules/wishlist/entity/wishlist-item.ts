import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, Unique } from "typeorm";
import { ProductVariant } from "@/modules/products/entity/product-variant";
import { WishlistPriority } from "../enum/wishlist.enum";
import { Wishlist } from "./wishlist.entity";
import { User } from "@/modules/users/entity/user.entity";

@Entity('wishlist_items')
@Unique('UQ_wishlist_items_wishlist_variant', ['wishlist_id', 'variant_id'])
@Index('IDX_wishlist_items_wishlist_id', ['wishlist_id'])
@Index('IDX_wishlist_items_variant_id', ['variant_id'])
export class WishlistItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  wishlist_id!: number;

  @ManyToOne(() => Wishlist, wishlist => wishlist.items, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'wishlist_id', foreignKeyConstraintName: 'FK_wishlist_items_wishlist' })
  wishlist!: Wishlist;

  @Column()
  variant_id!: number;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'variant_id', foreignKeyConstraintName: 'FK_wishlist_items_variant' })
  variant!: ProductVariant;

  user_id?: number;

  user?: User;

  @Column({ length: 500, nullable: true })
  notes?: string;

  @Column({
    type: 'simple-enum',
    enum: WishlistPriority,
    default: WishlistPriority.MEDIUM
  })
  priority!: WishlistPriority;

  @Column({ type: 'datetime', precision: 0 })
  added_at!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at!: Date;
}
