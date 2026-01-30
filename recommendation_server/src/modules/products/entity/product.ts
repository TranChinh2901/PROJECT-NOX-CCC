import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from "typeorm";
import { Category } from "./category";
import { Brand } from "./brand";
import { ProductVariant } from "./product-variant";
import { ProductImage } from "./product-image";

@Entity('products')
@Index(['category_id'])
@Index(['brand_id'])
@Index(['is_active'])
@Index(['is_featured'])
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  category_id!: number;

  @ManyToOne(() => Category, category => category.children)
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @Column({ nullable: true })
  brand_id?: number;

  @ManyToOne(() => Brand, brand => brand.id, { nullable: true })
  @JoinColumn({ name: 'brand_id' })
  brand?: Brand;

  @Column({ length: 200 })
  name!: string;

  @Column({ length: 200, unique: true })
  slug!: string;

  @Column({ length: 100, unique: true })
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

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at?: Date;

  @OneToMany(() => ProductVariant, variant => variant.product)
  variants?: ProductVariant[];

  @OneToMany(() => ProductImage, image => image.product)
  images?: ProductImage[];
}
