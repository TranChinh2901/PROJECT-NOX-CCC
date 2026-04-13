import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, DeleteDateColumn, Index, Unique } from "typeorm";
import { Category } from "./category";
import { Brand } from "./brand";
import { ProductVariant } from "./product-variant";
import { ProductImage } from "./product-image";
import { Review } from "@/modules/reviews/entity/review";

@Entity('products')
@Unique('UQ_products_slug', ['slug'])
@Unique('UQ_products_sku', ['sku'])
@Index('IDX_products_category_id', ['category_id'])
@Index('IDX_products_brand_id', ['brand_id'])
@Index('IDX_products_is_active', ['is_active'])
@Index('IDX_products_is_featured', ['is_featured'])
@Index('IDX_products_slug', ['slug'])
@Index('IDX_products_sku', ['sku'])
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  category_id!: number;

  @ManyToOne(() => Category, category => category.children, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'category_id', foreignKeyConstraintName: 'FK_products_category' })
  category!: Category;

  @Column({ nullable: true })
  brand_id?: number;

  @ManyToOne(() => Brand, { nullable: true, onDelete: 'SET NULL', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'brand_id', foreignKeyConstraintName: 'FK_products_brand' })
  brand?: Brand;

  @Column({ length: 200 })
  name!: string;

  @Column({ length: 200 })
  slug!: string;

  @Column({ length: 100 })
  sku!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ length: 500, nullable: true })
  short_description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  base_price!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  compare_at_price?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost_price?: number;

  @Column({ type: 'decimal', precision: 8, scale: 3, nullable: true })
  weight_kg?: number;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'boolean', default: false })
  is_featured!: boolean;

  @Column({ length: 255, nullable: true })
  meta_title?: string;

  @Column({ length: 500, nullable: true })
  meta_description?: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'datetime', precision: 0, nullable: true })
  deleted_at?: Date;

  @Column({ type: 'json', nullable: true, select: false })
  embedding?: number[];

  @OneToMany(() => ProductVariant, variant => variant.product)
  variants?: ProductVariant[];

  @OneToMany(() => ProductImage, image => image.product)
  images?: ProductImage[];

  @OneToMany(() => Review, review => review.product)
  reviews?: Review[];
}
