import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity('user_addresses')
@Index('IDX_user_addresses_user_id', ['user_id'])
export class UserAddress {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user_id!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_user_addresses_user' })
  user!: User;

  @Column({ type: 'varchar', length: 100 })
  label!: string;

  @Column({ type: 'varchar', length: 255 })
  address_line1!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address_line2!: string | null;

  @Column({ type: 'varchar', length: 100 })
  city!: string;

  @Column({ type: 'varchar', length: 100 })
  state!: string;

  @Column({ type: 'varchar', length: 20 })
  postal_code!: string;

  @Column({ type: 'varchar', length: 100 })
  country!: string;

  @Column({ type: 'boolean', default: false })
  is_default!: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at!: Date;
}
