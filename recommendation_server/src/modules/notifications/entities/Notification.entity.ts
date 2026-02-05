import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from "typeorm";
import { NotificationTemplate } from "./NotificationTemplate.entity";
import { NotificationRecipient } from "./NotificationRecipient.entity";
import { NotificationGroup } from "./NotificationGroup.entity";
import { NotificationPriority } from "../enums/NotificationPriority.enum";

@Entity('notifications')
@Index('idx_notifications_template', ['template_id'])
@Index('idx_notifications_group', ['group_id'])
@Index('idx_notifications_type', ['type'])
@Index('idx_notifications_order', ['order_id'], { where: 'order_id IS NOT NULL' })
@Index('idx_notifications_product', ['product_id'], { where: 'product_id IS NOT NULL' })
@Index('idx_notifications_expires', ['expires_at'], { where: 'expires_at IS NOT NULL' })
@Index('idx_notifications_created', ['created_at'])
@Index('idx_notifications_priority_created', ['priority', 'created_at'])
export class Notification {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: number;

    @Column({ type: 'bigint', nullable: true, unsigned: true })
    template_id?: number;

    @Column({ type: 'bigint', nullable: true, unsigned: true })
    group_id?: number;

    @Column({ type: 'varchar', length: 50 })
    type!: string;

    @Column({
        type: 'enum',
        enum: NotificationPriority,
        default: NotificationPriority.MEDIUM
    })
    priority!: NotificationPriority;

    @Column({ type: 'varchar', length: 500 })
    title!: string;

    @Column({ type: 'text' })
    message!: string;

    @Column({ type: 'json', default: '{}' })
    metadata!: Record<string, any>;

    @Column({ type: 'int', nullable: true })
    order_id?: number;

    @Column({ type: 'int', nullable: true })
    product_id?: number;

    @Column({ type: 'varchar', length: 100, nullable: true })
    user_action?: string;

    @Column({ type: 'timestamp', nullable: true })
    expires_at?: Date;

    @CreateDateColumn({ type: 'timestamp' })
    created_at!: Date;

    @ManyToOne(() => NotificationTemplate, template => template.notifications)
    @JoinColumn({ name: 'template_id' })
    template?: NotificationTemplate;

    @ManyToOne(() => NotificationGroup, group => group.notifications)
    @JoinColumn({ name: 'group_id' })
    group?: NotificationGroup;

    @OneToMany(() => NotificationRecipient, recipient => recipient.notification)
    recipients?: NotificationRecipient[];
}
