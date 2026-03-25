import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { Inventory } from "./inventory";
import { InventoryActionType } from "../enum/inventory.enum";
import { User } from "@/modules/users/entity/user.entity";

@Entity('inventory_logs')
@Index('IDX_inventory_logs_inventory_id', ['inventory_id'])
@Index('IDX_inventory_logs_performed_by_user_id', ['performed_by_user_id'])
@Index('IDX_inventory_logs_action_type', ['action_type'])
@Index('IDX_inventory_logs_created_at', ['created_at'])
export class InventoryLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  inventory_id!: number;

  @ManyToOne(() => Inventory, inventory => inventory.id, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'inventory_id', foreignKeyConstraintName: 'FK_inventory_logs_inventory' })
  inventory!: Inventory;

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

  @Column({ type: 'int', nullable: true })
  performed_by_user_id!: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'performed_by_user_id', foreignKeyConstraintName: 'FK_inventory_logs_performed_by_user' })
  performed_by_user!: User | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}
