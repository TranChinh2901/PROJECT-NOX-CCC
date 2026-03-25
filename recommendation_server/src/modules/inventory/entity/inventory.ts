import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, Unique } from "typeorm";
import { ProductVariant } from "@/modules/products/entity/product-variant";
import { Warehouse } from "./warehouse";

@Entity('inventory')
@Unique('UQ_inventory_variant_warehouse', ['variant_id', 'warehouse_id'])
@Index('IDX_inventory_variant_id', ['variant_id'])
@Index('IDX_inventory_warehouse_id', ['warehouse_id'])
@Index('IDX_inventory_quantity_available', ['quantity_available'])
export class Inventory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  variant_id!: number;

  @ManyToOne(() => ProductVariant, variant => variant.id, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'variant_id', foreignKeyConstraintName: 'FK_inventory_variant' })
  variant!: ProductVariant;

  @Column()
  warehouse_id!: number;

  @ManyToOne(() => Warehouse, warehouse => warehouse.id, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'warehouse_id', foreignKeyConstraintName: 'FK_inventory_warehouse' })
  warehouse!: Warehouse;

  @Column({ type: 'int', default: 0 })
  quantity_available!: number;

  @Column({ type: 'int', default: 0 })
  quantity_reserved!: number;

  @Column({ type: 'int', default: 0 })
  quantity_total!: number;

  @Column({ type: 'int', default: 10 })
  reorder_level!: number;

  @Column({ type: 'int', nullable: true })
  reorder_quantity?: number;

  @Column({ type: 'datetime', precision: 0, nullable: true })
  last_counted_at?: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at!: Date;
}
