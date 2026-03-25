import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, DeleteDateColumn, Index, Unique } from "typeorm";

@Entity('categories')
@Unique('UQ_categories_name', ['name'])
@Unique('UQ_categories_slug', ['slug'])
@Index('IDX_categories_slug', ['slug'])
@Index('IDX_categories_parent_id', ['parent_id'])
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 100 })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  parent_id?: number;

  @ManyToOne(() => Category, category => category.children, { nullable: true, onDelete: 'SET NULL', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'parent_id', foreignKeyConstraintName: 'FK_categories_parent' })
  parent?: Category;

  @OneToMany(() => Category, category => category.parent)
  children?: Category[];

  @Column({ length: 255, nullable: true })
  image_url?: string;

  @Column({ default: 0 })
  sort_order!: number;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'datetime', precision: 0, nullable: true })
  deleted_at?: Date;
}
