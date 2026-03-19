import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, Unique } from "typeorm";
import { User } from "./user.entity";
import { DeviceType } from "../enum/user-session.enum";

@Entity('user_sessions')
@Unique('UQ_user_sessions_session_token', ['session_token'])
@Index('IDX_user_sessions_user_id', ['user_id'])
@Index('IDX_user_sessions_is_active', ['is_active'])
export class UserSession {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: true })
  user_id?: number;

  @Column({ length: 255 })
  session_token!: string;

  @Column({ length: 45, nullable: true })
  ip_address?: string;

  @Column({ length: 500, nullable: true })
  user_agent?: string;

  @Column({ 
    type: 'simple-enum', 
    enum: DeviceType, 
    default: DeviceType.UNKNOWN 
  })
  device_type!: DeviceType;

  @Column({ type: 'datetime', precision: 0 })
  started_at!: Date;

  @Column({ type: 'datetime', precision: 0, nullable: true })
  ended_at?: Date;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @ManyToOne(() => User, (user) => user.sessions, { nullable: true, onDelete: 'SET NULL', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_user_sessions_user' })
  user?: User;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at!: Date;
}
