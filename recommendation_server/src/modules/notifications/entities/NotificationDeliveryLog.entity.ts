import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { NotificationRecipient } from "./NotificationRecipient.entity";
import { NotificationChannel } from "../enums/NotificationChannel.enum";

export enum DeliveryStatus {
    PENDING = 'pending',
    SUCCESS = 'success',
    FAILED = 'failed',
    RETRYING = 'retrying',
    ABANDONED = 'abandoned'
}

@Entity('notification_delivery_log')
@Index('idx_delivery_log_retry', ['status', 'next_retry_at'], { where: "status = 'failed' AND next_retry_at IS NOT NULL" })
@Index('idx_delivery_log_recipient', ['recipient_id'])
@Index('idx_delivery_log_attempted', ['attempted_at'])
@Index('idx_delivery_log_channel_status', ['channel', 'status'])
export class NotificationDeliveryLog {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: number;

    @Column({ type: 'bigint', unsigned: true })
    recipient_id!: number;

    @Column({
        type: 'enum',
        enum: NotificationChannel
    })
    channel!: NotificationChannel;

    @Column({ type: 'smallint', default: 1 })
    attempt_number!: number;

    @Column({
        type: 'enum',
        enum: DeliveryStatus
    })
    status!: DeliveryStatus;

    @Column({ type: 'varchar', length: 50, nullable: true })
    error_code?: string;

    @Column({ type: 'text', nullable: true })
    error_message?: string;

    @Column({ type: 'json', nullable: true })
    response_data?: Record<string, any>;

    @CreateDateColumn({ type: 'timestamp' })
    attempted_at!: Date;

    @Column({ type: 'timestamp', nullable: true })
    next_retry_at?: Date;

    @ManyToOne(() => NotificationRecipient, recipient => recipient.delivery_logs, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'recipient_id' })
    recipient!: NotificationRecipient;
}
