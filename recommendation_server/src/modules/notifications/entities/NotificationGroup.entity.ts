import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from "typeorm";
import { User } from "@/modules/users/entity/user.entity";
import { Notification } from "./Notification.entity";

@Entity('notification_groups')
@Index('idx_groups_user', ['user_id'])
@Index('idx_groups_updated', ['updated_at'])
@Index('idx_groups_type', ['notification_type'])
export class NotificationGroup {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: number;

    @Column({ type: 'varchar', length: 255 })
    group_key!: string;

    @Column({ type: 'int' })
    user_id!: number;

    @Column({ type: 'varchar', length: 50 })
    notification_type!: string;

    @Column({ type: 'int', default: 1 })
    aggregated_count!: number;

    @Column({ type: 'bigint', nullable: true, unsigned: true })
    last_notification_id?: number;

    @CreateDateColumn({ type: 'timestamp' })
    created_at!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at!: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ManyToOne(() => Notification, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'last_notification_id' })
    last_notification?: Notification;

    @OneToMany(() => Notification, notification => notification.group)
    notifications?: Notification[];
}
