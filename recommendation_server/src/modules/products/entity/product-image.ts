import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from "typeorm";
import { Product } from "./product";
import { ProductVariant } from "./product-variant";

@Entity('product_images')
@Index(['product_id'])
@Index(['variant_id'])
@Index(['is_primary'])
export class ProductImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  product_id!: number;

  @ManyToOne(() => Product, product => product.id)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ nullable: true })
  variant_id?: number;

  @ManyToOne(() => ProductVariant, variant => variant.id, { nullable: true })
  @JoinColumn({ name: 'variant_id' })
  variant?: ProductVariant;

  @Column({ length: 500 })
  image_url!: string;

  @Column({ length: 500, nullable: true })
  thumbnail_url?: string;

  @Column({ length: 255, nullable: true })
  alt_text?: string;

  @Column({ default: 0 })
  sort_order!: number;

  @Column({ type: 'boolean', default: false })
  is_primary!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at?: Date;
}
