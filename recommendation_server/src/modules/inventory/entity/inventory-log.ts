import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Index } from "typeorm";
import { Inventory } from "./inventory";
import { ProductVariant } from "@/modules/products/entity/product-variant";
import { Warehouse } from "./warehouse";
import { InventoryActionType } from "../enum/inventory.enum";
import { User } from "@/modules/users/entity/user.entity";

@Entity('inventory_logs')
@Index(['inventory_id'])
@Index(['performed_by_user_id'])
@Index(['action_type'])
@Index(['created_at'])
export class InventoryLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  inventory_id!: number;

  @ManyToOne(() => Inventory, inventory => inventory.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inventory_id' })
  inventory!: Inventory;

  variant_id?: number;

  variant?: ProductVariant;

  warehouse_id?: number;

  warehouse?: Warehouse;

  @Column({ type: 'simple-enum', enum: InventoryActionType })
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

  @Column({ nullable: true })
  performed_by_user_id!: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'performed_by_user_id' })
  performed_by_user!: User | null;

  performed_by?: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;
}
