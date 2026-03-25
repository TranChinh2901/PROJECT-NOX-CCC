/**
 * Value Object: NotificationPriorityVO
 * Represents the priority level of a notification
 */
import { NotificationPriority } from '../../enum/notification.enum';

export class NotificationPriorityVO {
  private constructor(private readonly value: NotificationPriority) {}

  static create(priority: NotificationPriority): NotificationPriorityVO {
    if (!Object.values(NotificationPriority).includes(priority)) {
      throw new Error(`Invalid notification priority: ${priority}`);
    }
    return new NotificationPriorityVO(priority);
  }

  static normal(): NotificationPriorityVO {
    return new NotificationPriorityVO(NotificationPriority.NORMAL);
  }

  static high(): NotificationPriorityVO {
    return new NotificationPriorityVO(NotificationPriority.HIGH);
  }

  static urgent(): NotificationPriorityVO {
    return new NotificationPriorityVO(NotificationPriority.URGENT);
  }

  static low(): NotificationPriorityVO {
    return new NotificationPriorityVO(NotificationPriority.LOW);
  }

  getValue(): NotificationPriority {
    return this.value;
  }

  isUrgent(): boolean {
    return this.value === NotificationPriority.URGENT;
  }

  isHighOrAbove(): boolean {
    return (
      this.value === NotificationPriority.HIGH ||
      this.value === NotificationPriority.URGENT
    );
  }

  requiresImmediateDelivery(): boolean {
    return this.isHighOrAbove();
  }

  toString(): string {
    return this.value;
  }

  equals(other: NotificationPriorityVO): boolean {
    return this.value === other.value;
  }
}
