import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, DeleteDateColumn, Index, Unique } from "typeorm";
import { Cart } from "./cart";
import { ProductVariant } from "@/modules/products/entity/product-variant";

@Entity('cart_items')
@Unique('UQ_cart_items_cart_variant', ['cart_id', 'variant_id'])
@Index('IDX_cart_items_cart_id', ['cart_id'])
@Index('IDX_cart_items_variant_id', ['variant_id'])
export class CartItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  cart_id!: number;

  @ManyToOne(() => Cart, cart => cart.items, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'cart_id', foreignKeyConstraintName: 'FK_cart_items_cart' })
  cart!: Cart;

  @Column()
  variant_id!: number;

  @ManyToOne(() => ProductVariant, variant => variant.id, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'variant_id', foreignKeyConstraintName: 'FK_cart_items_variant' })
  variant!: ProductVariant;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_price!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_price!: number;

  @Column({ type: 'datetime', precision: 0 })
  added_at!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'datetime', precision: 0, nullable: true })
  deleted_at?: Date;
}
