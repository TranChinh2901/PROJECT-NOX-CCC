import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { Order } from "./order";
import { ProductVariant } from "@/modules/products/entity/product-variant";
import { Warehouse } from "@/modules/inventory/entity/warehouse";

@Entity('order_items')
@Index(['order_id'])
@Index(['variant_id'])
@Index(['warehouse_id'])
export class OrderItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  order_id!: number;

  @ManyToOne(() => Order, order => order.items)
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column()
  variant_id!: number;

  @ManyToOne(() => ProductVariant, variant => variant.id)
  @JoinColumn({ name: 'variant_id' })
  variant!: ProductVariant;

  @Column({ type: 'int', nullable: true })
  warehouse_id?: number;

  @ManyToOne(() => Warehouse, warehouse => warehouse.id, { nullable: true })
  @JoinColumn({ name: 'warehouse_id' })
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

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;
}
