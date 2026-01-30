

import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { GenderType } from "../enum/user.enum";
import { RoleType } from "@/modules/auth/enum/auth.enum";
import { UserSession } from "./user-session";

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  fullname!: string;

  @Column({ length: 150, unique: true })
  email!: string;

  @Column({ length: 20, unique: true })
  phone_number!: string;
  
  @Column({ length: 255, nullable: true })
  address?: string;

  @Column({ length: 255, nullable: true })
  avatar?: string;

  @Column({ length: 255 })
  password!: string;

  @Column({ type: 'enum', enum: GenderType, nullable: true })
  gender?: GenderType;

  @Column({ type: 'date', nullable: true }) 
  date_of_birth?: Date;

  @Column({ type: 'boolean', default: false })
  is_verified!: boolean;

  @Column({ type: 'enum', enum: RoleType, default: RoleType.USER })
  role!: RoleType;

  @OneToMany(() => UserSession, (session) => session.user)
  sessions?: UserSession[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;
}