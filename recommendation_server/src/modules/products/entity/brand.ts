import { Entity, Column, PrimaryGeneratedColumn, DeleteDateColumn, Index, Unique } from "typeorm";

@Entity('brands')
@Unique('UQ_brands_name', ['name'])
@Unique('UQ_brands_slug', ['slug'])
@Index('IDX_brands_slug', ['slug'])
export class Brand {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 100 })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 255, nullable: true })
  logo_url?: string;

  @Column({ length: 255, nullable: true })
  website_url?: string;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'datetime', precision: 0, nullable: true })
  deleted_at?: Date;
}
