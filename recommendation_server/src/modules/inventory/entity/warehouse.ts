import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";

@Entity('warehouses')
export class Warehouse {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 20, unique: true })
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

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at?: Date;
}
