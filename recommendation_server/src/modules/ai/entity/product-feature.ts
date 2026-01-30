import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from "typeorm";
import { Product } from "@/modules/products/entity/product";
import { User } from "@/modules/users/entity/user.entity";
import { ProductFeatureType, FeatureSource } from "../enum/product-feature.enum";

@Entity('product_features')
@Unique(['product_id', 'feature_type', 'feature_value'])
@Index(['product_id'])
@Index(['feature_type'])
@Index(['feature_value'])
export class ProductFeature {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  product_id!: number;

  @ManyToOne(() => Product, product => product.id)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'enum', enum: ProductFeatureType })
  feature_type!: ProductFeatureType;

  @Column({ length: 100 })
  feature_value!: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  confidence_score?: number;

  @Column({ type: 'enum', enum: FeatureSource, default: FeatureSource.MANUAL })
  source!: FeatureSource;

  @Column({ default: 1 })
  weight!: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;
}
