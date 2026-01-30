import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from "typeorm";
import { User } from "@/modules/users/entity/user.entity";
import { ProductVariant } from "@/modules/products/entity/product-variant";
import { WishlistPriority } from "../enum/wishlist.enum";

@Entity('wishlist_items')
@Unique(['user_id', 'variant_id'])
@Index(['user_id'])
@Index(['variant_id'])
export class WishlistItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user_id!: number;

  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column()
  variant_id!: number;

  @ManyToOne(() => ProductVariant, variant => variant.id)
  @JoinColumn({ name: 'variant_id' })
  variant!: ProductVariant;

  @Column({ length: 500, nullable: true })
  notes?: string;

  @Column({ 
    type: 'enum', 
    enum: WishlistPriority, 
    default: WishlistPriority.MEDIUM 
  })
  priority!: WishlistPriority;

  @Column({ type: 'timestamp' })
  added_at!: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;
}
