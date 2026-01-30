import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  ManyToOne, 
  JoinColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  Index 
} from "typeorm";
import { User } from "./user.entity";
import { DeviceType } from "../enum/user-session.enum";

@Entity('user_sessions')
@Index(['user_id'])
@Index(['is_active'])
export class UserSession {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: true })
  user_id?: number;

  @Column({ length: 255, unique: true })
  session_token!: string;

  @Column({ length: 45, nullable: true })
  ip_address?: string;

  @Column({ length: 500, nullable: true })
  user_agent?: string;

  @Column({ 
    type: 'enum', 
    enum: DeviceType, 
    default: DeviceType.UNKNOWN 
  })
  device_type!: DeviceType;

  @Column({ type: 'timestamp' })
  started_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  ended_at?: Date;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @ManyToOne(() => User, (user) => user.sessions, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;
}
