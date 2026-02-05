import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from "typeorm";
import { Notification } from "./Notification.entity";

@Entity('notification_templates')
@Index('idx_templates_type', ['type'], { where: 'is_active = 1' })
@Index('idx_templates_channel', ['channel'], { where: 'is_active = 1' })
export class NotificationTemplate {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: number;

    @Column({ type: 'varchar', length: 50 })
    type!: string;

    @Column({ type: 'varchar', length: 20 })
    channel!: string;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    subject?: string;

    @Column({ type: 'text' })
    body!: string;

    @Column({ type: 'json', default: '{}' })
    variables!: Record<string, any>;

    @Column({ type: 'boolean', default: true })
    is_active!: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    created_at!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at!: Date;

    @OneToMany(() => Notification, notification => notification.template)
    notifications?: Notification[];
}
