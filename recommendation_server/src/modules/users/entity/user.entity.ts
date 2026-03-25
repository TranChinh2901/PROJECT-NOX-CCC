

import { Entity, Column, PrimaryGeneratedColumn, OneToMany, Index, Unique } from "typeorm";
import { GenderType } from "../enum/user.enum";
import { RoleType } from "@/modules/auth/enum/auth.enum";
import { UserSession } from "./user-session";

@Entity('users')
@Unique('UQ_users_email', ['email'])
@Unique('UQ_users_phone_number', ['phone_number'])
@Index('IDX_users_email', ['email'])
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  fullname!: string;

  @Column({ length: 150 })
  email!: string;

  @Column({ length: 20 })
  phone_number!: string;
  
  @Column({ length: 255, nullable: true })
  address?: string;

  @Column({ length: 255, nullable: true })
  avatar?: string;

  @Column({ length: 255 })
  password!: string;

  @Column({ type: 'simple-enum', enum: GenderType, nullable: true })
  gender?: GenderType;

  @Column({ type: 'date', nullable: true }) 
  date_of_birth?: Date;

  @Column({ type: 'boolean', default: false })
  is_verified!: boolean;

  @Column({ type: 'simple-enum', enum: RoleType, default: RoleType.USER })
  role!: RoleType;

  @OneToMany(() => UserSession, (session) => session.user)
  sessions?: UserSession[];

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at!: Date;

  @Column({ type: 'datetime', precision: 0, nullable: true, default: null })
  deleted_at!: Date | null;
}
