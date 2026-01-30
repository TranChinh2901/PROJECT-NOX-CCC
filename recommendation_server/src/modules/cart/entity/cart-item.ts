import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index, Unique } from "typeorm";
import { Cart } from "./cart";
import { ProductVariant } from "@/modules/products/entity/product-variant";

@Entity('cart_items')
@Unique(['cart_id', 'variant_id'])
@Index(['cart_id'])
@Index(['variant_id'])
export class CartItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  cart_id!: number;

  @ManyToOne(() => Cart, cart => cart.items)
  @JoinColumn({ name: 'cart_id' })
  cart!: Cart;

  @Column()
  variant_id!: number;

  @ManyToOne(() => ProductVariant, variant => variant.id)
  @JoinColumn({ name: 'variant_id' })
  variant!: ProductVariant;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_price!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_price!: number;

  @Column({ type: 'timestamp' })
  added_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at?: Date;
}
