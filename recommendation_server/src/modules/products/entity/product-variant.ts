import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from "typeorm";
import { Product } from "./product";

@Entity('product_variants')
@Index(['product_id'])
@Index(['is_active'])
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  product_id!: number;

  @ManyToOne(() => Product, product => product.id)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ length: 100, unique: true })
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

  @Column({ length: 100, nullable: true, unique: true })
  barcode?: string;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ default: 0 })
  sort_order!: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at?: Date;
}
