import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, DeleteDateColumn, Index, Unique } from "typeorm";
import { Product } from "./product";
import { ProductImage } from "./product-image";

@Entity('product_variants')
@Unique('UQ_product_variants_sku', ['sku'])
@Unique('UQ_product_variants_barcode', ['barcode'])
@Index('IDX_product_variants_product_id', ['product_id'])
@Index('IDX_product_variants_is_active', ['is_active'])
@Index('IDX_product_variants_sku', ['sku'])
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  product_id!: number;

  @ManyToOne(() => Product, product => product.variants, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'product_id', foreignKeyConstraintName: 'FK_product_variants_product' })
  product!: Product;

  @Column({ length: 100 })
  sku!: string;

  @Column({ length: 50, nullable: true })
  size?: string;

  @Column({ length: 50, nullable: true })
  color?: string;

  @Column({ length: 7, nullable: true })
  color_code?: string;

  @Column({ length: 50, nullable: true })
  material?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price_adjustment!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  final_price!: number;

  @Column({ type: 'decimal', precision: 8, scale: 3, nullable: true })
  weight_kg?: number;

  @Column({ length: 100, nullable: true })
  barcode?: string;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ default: 0 })
  sort_order!: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'datetime', precision: 0, nullable: true })
  deleted_at?: Date;

  @OneToMany(() => ProductImage, (image) => image.variant)
  images?: ProductImage[];
}
