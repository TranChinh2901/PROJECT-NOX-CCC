import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from "typeorm";
import { ProductVariant } from "@/modules/products/entity/product-variant";
import { Warehouse } from "./warehouse";

@Entity('inventory')
@Unique(['variant_id', 'warehouse_id'])
@Index(['variant_id'])
@Index(['warehouse_id'])
@Index(['quantity_available'])
export class Inventory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  variant_id!: number;

  @ManyToOne(() => ProductVariant, variant => variant.id)
  @JoinColumn({ name: 'variant_id' })
  variant!: ProductVariant;

  @Column()
  warehouse_id!: number;

  @ManyToOne(() => Warehouse, warehouse => warehouse.id)
  @JoinColumn({ name: 'warehouse_id' })
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

  @Column({ type: 'timestamp', nullable: true })
  last_counted_at?: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;
}
