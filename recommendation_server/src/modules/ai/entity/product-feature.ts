import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, Unique } from "typeorm";
import { Product } from "@/modules/products/entity/product";
import { User } from "@/modules/users/entity/user.entity";
import { ProductFeatureType, FeatureSource } from "../enum/product-feature.enum";

@Entity('product_features')
@Unique('UQ_product_features_product_type_value', ['product_id', 'feature_type', 'feature_value'])
@Index('IDX_product_features_product_id', ['product_id'])
@Index('IDX_product_features_feature_type', ['feature_type'])
@Index('IDX_product_features_feature_value', ['feature_value'])
export class ProductFeature {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  product_id!: number;

  @ManyToOne(() => Product, product => product.id, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'product_id', foreignKeyConstraintName: 'FK_product_features_product' })
  product!: Product;

  @Column({ type: 'simple-enum', enum: ProductFeatureType })
  feature_type!: ProductFeatureType;

  @Column({ length: 100 })
  feature_value!: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  confidence_score?: number;

  @Column({ type: 'simple-enum', enum: FeatureSource, default: FeatureSource.MANUAL })
  source!: FeatureSource;

  @Column({ default: 1 })
  weight!: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at!: Date;
}
