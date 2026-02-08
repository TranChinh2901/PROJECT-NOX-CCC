import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from "typeorm";
import { ProductVariant } from "@/modules/products/entity/product-variant";
import { WishlistPriority } from "../enum/wishlist.enum";
import { Wishlist } from "./wishlist.entity";

@Entity('wishlist_items')
@Unique(['wishlist_id', 'variant_id'])
@Index(['wishlist_id'])
@Index(['variant_id'])
export class WishlistItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  wishlist_id!: number;

  @ManyToOne(() => Wishlist, wishlist => wishlist.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wishlist_id' })
  wishlist!: Wishlist;

  @Column()
  variant_id!: number;

  @ManyToOne(() => ProductVariant)
  @JoinColumn({ name: 'variant_id' })
  variant!: ProductVariant;

  @Column({ length: 500, nullable: true })
  notes?: string;

  @Column({
    type: 'simple-enum',
    enum: WishlistPriority,
    default: WishlistPriority.MEDIUM
  })
  priority!: WishlistPriority;

  @Column({ type: 'datetime' })
  added_at!: Date;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;
}
