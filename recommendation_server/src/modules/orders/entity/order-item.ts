import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { Order } from "./order";
import { ProductVariant } from "@/modules/products/entity/product-variant";
import { Warehouse } from "@/modules/inventory/entity/warehouse";

@Entity('order_items')
@Index('IDX_order_items_order_id', ['order_id'])
@Index('IDX_order_items_variant_id', ['variant_id'])
@Index('IDX_order_items_warehouse_id', ['warehouse_id'])
export class OrderItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  order_id!: number;

  @ManyToOne(() => Order, order => order.items, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'order_id', foreignKeyConstraintName: 'FK_order_items_order' })
  order!: Order;

  @Column()
  variant_id!: number;

  @ManyToOne(() => ProductVariant, variant => variant.id, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'variant_id', foreignKeyConstraintName: 'FK_order_items_variant' })
  variant!: ProductVariant;

  @Column({ type: 'int', nullable: true })
  warehouse_id?: number;

  @ManyToOne(() => Warehouse, warehouse => warehouse.id, { nullable: true, onDelete: 'SET NULL', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'warehouse_id', foreignKeyConstraintName: 'FK_order_items_warehouse' })
  warehouse?: Warehouse;

  @Column({ type: 'json' })
  product_snapshot!: object;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_price!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_price!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount_amount!: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at!: Date;
}
