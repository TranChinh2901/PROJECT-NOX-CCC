import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('site_navigation_items')
@Index('IDX_site_navigation_location_active_sort', ['location', 'is_active', 'sort_order'])
export class SiteNavigationItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 50, default: 'header_primary' })
  location!: string;

  @Column({ length: 100 })
  label!: string;

  @Column({ length: 255 })
  href!: string;

  @Column({ length: 20, default: '_self' })
  target!: string;

  @Column({ default: 0 })
  sort_order!: number;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn({ type: 'datetime', precision: 6 })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime', precision: 6 })
  updated_at!: Date;
}
