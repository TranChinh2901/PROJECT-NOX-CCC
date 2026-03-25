import { Entity, Column, PrimaryGeneratedColumn, DeleteDateColumn, Unique } from "typeorm";

@Entity('warehouses')
@Unique('UQ_warehouses_code', ['code'])
export class Warehouse {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 20 })
  code!: string;

  @Column({ length: 255 })
  address!: string;

  @Column({ length: 100 })
  city!: string;

  @Column({ length: 100, default: 'Vietnam' })
  country!: string;

  @Column({ length: 100, nullable: true })
  contact_name?: string;

  @Column({ length: 20, nullable: true })
  contact_phone?: string;

  @Column({ length: 150, nullable: true })
  contact_email?: string;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'boolean', default: false })
  is_default!: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'datetime', precision: 0, nullable: true })
  deleted_at?: Date;
}
