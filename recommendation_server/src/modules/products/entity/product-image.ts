import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, DeleteDateColumn, Index } from "typeorm";
import { Product } from "./product";
import { ProductVariant } from "./product-variant";

@Entity('product_images')
@Index('IDX_product_images_product_id', ['product_id'])
@Index('IDX_product_images_variant_id', ['variant_id'])
@Index('IDX_product_images_is_primary', ['is_primary'])
export class ProductImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  product_id!: number;

  @ManyToOne(() => Product, product => product.images, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'product_id', foreignKeyConstraintName: 'FK_product_images_product' })
  product!: Product;

  @Column({ nullable: true })
  variant_id?: number;

  @ManyToOne(() => ProductVariant, variant => variant.images, { nullable: true, onDelete: 'SET NULL', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'variant_id', foreignKeyConstraintName: 'FK_product_images_variant' })
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

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'datetime', precision: 0, nullable: true })
  deleted_at?: Date;
}
