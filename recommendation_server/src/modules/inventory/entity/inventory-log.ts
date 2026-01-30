import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Index } from "typeorm";
import { Inventory } from "./inventory";
import { ProductVariant } from "@/modules/products/entity/product-variant";
import { Warehouse } from "./warehouse";
import { InventoryActionType } from "../enum/inventory.enum";

@Entity('inventory_logs')
@Index(['inventory_id'])
@Index(['variant_id'])
@Index(['action_type'])
@Index(['created_at'])
export class InventoryLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  inventory_id!: number;

  @ManyToOne(() => Inventory, inventory => inventory.id)
  @JoinColumn({ name: 'inventory_id' })
  inventory!: Inventory;

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

  @Column({ type: 'enum', enum: InventoryActionType })
  action_type!: InventoryActionType;

  @Column({ type: 'int' })
  quantity_change!: number;

  @Column({ type: 'int' })
  quantity_before!: number;

  @Column({ type: 'int' })
  quantity_after!: number;

  @Column({ type: 'int', nullable: true })
  reference_id?: number;

  @Column({ length: 50, nullable: true })
  reference_type?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ length: 100, nullable: true })
  performed_by?: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;
}
