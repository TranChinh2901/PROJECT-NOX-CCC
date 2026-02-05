import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from "typeorm";
import { Notification } from "./Notification.entity";
import { User } from "@/modules/users/entity/user.entity";
import { NotificationDeliveryLog } from "./NotificationDeliveryLog.entity";
import { NotificationStatus } from "../enums/NotificationStatus.enum";
import { NotificationChannel } from "../enums/NotificationChannel.enum";

@Entity('notification_recipients')
@Index('idx_recipients_user_status_created', ['user_id', 'status', 'created_at'])
@Index('idx_recipients_user_unread', ['user_id', 'created_at'], { where: "status = 'read'" })
@Index('idx_recipients_notification', ['notification_id'])
@Index('idx_recipients_channel_status', ['channel', 'status'])
@Index('idx_recipients_old_read', ['created_at'], { where: "status = 'read'" })
@Index('idx_recipients_pending', ['status', 'created_at'], { where: "status = 'pending'" })
export class NotificationRecipient {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: number;

    @Column({ type: 'bigint', unsigned: true })
    notification_id!: number;

    @Column({ type: 'int' })
    user_id!: number;

    @Column({
        type: 'enum',
        enum: NotificationStatus,
        default: NotificationStatus.PENDING
    })
    status!: NotificationStatus;

    @Column({
        type: 'enum',
        enum: NotificationChannel
    })
    channel!: NotificationChannel;

    @Column({ type: 'timestamp', nullable: true })
    sent_at?: Date;

    @Column({ type: 'timestamp', nullable: true })
    delivered_at?: Date;

    @Column({ type: 'timestamp', nullable: true })
    read_at?: Date;

    @CreateDateColumn({ type: 'timestamp' })
    created_at!: Date;

    @ManyToOne(() => Notification, notification => notification.recipients, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'notification_id' })
    notification!: Notification;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @OneToMany(() => NotificationDeliveryLog, log => log.recipient)
    delivery_logs?: NotificationDeliveryLog[];
}
