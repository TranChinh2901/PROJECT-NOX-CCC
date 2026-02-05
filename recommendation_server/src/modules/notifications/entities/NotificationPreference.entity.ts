import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { User } from "@/modules/users/entity/user.entity";
import { NotificationChannel } from "../enums/NotificationChannel.enum";
import { DeliveryFrequency } from "../enums/DeliveryFrequency.enum";

@Entity('notification_preferences')
@Index('idx_preferences_user', ['user_id'])
@Index('idx_preferences_type_enabled', ['notification_type', 'enabled'])
export class NotificationPreference {
    @PrimaryColumn({ type: 'int' })
    user_id!: number;

    @PrimaryColumn({ type: 'varchar', length: 50 })
    notification_type!: string;

    @PrimaryColumn({
        type: 'enum',
        enum: NotificationChannel
    })
    channel!: NotificationChannel;

    @Column({ type: 'boolean', default: true })
    enabled!: boolean;

    @Column({
        type: 'enum',
        enum: DeliveryFrequency,
        default: DeliveryFrequency.REALTIME
    })
    frequency!: DeliveryFrequency;

    @Column({ type: 'json', default: '{}' })
    custom_settings!: Record<string, any>;

    @CreateDateColumn({ type: 'timestamp' })
    created_at!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at!: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;
}
