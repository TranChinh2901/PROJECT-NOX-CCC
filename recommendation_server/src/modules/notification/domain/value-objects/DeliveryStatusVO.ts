/**
 * Value Object: DeliveryStatusVO
 * Represents the delivery status of a notification
 */
import { DeliveryStatus } from '../../enum/notification.enum';

export class DeliveryStatusVO {
  private constructor(private readonly value: DeliveryStatus) {}

  static create(status: DeliveryStatus): DeliveryStatusVO {
    if (!Object.values(DeliveryStatus).includes(status)) {
      throw new Error(`Invalid delivery status: ${status}`);
    }
    return new DeliveryStatusVO(status);
  }

  static pending(): DeliveryStatusVO {
    return new DeliveryStatusVO(DeliveryStatus.PENDING);
  }

  static sent(): DeliveryStatusVO {
    return new DeliveryStatusVO(DeliveryStatus.SENT);
  }

  static delivered(): DeliveryStatusVO {
    return new DeliveryStatusVO(DeliveryStatus.DELIVERED);
  }

  static failed(): DeliveryStatusVO {
    return new DeliveryStatusVO(DeliveryStatus.FAILED);
  }

  static retry(): DeliveryStatusVO {
    return new DeliveryStatusVO(DeliveryStatus.RETRY);
  }

  getValue(): DeliveryStatus {
    return this.value;
  }

  isPending(): boolean {
    return this.value === DeliveryStatus.PENDING;
  }

  isSent(): boolean {
    return this.value === DeliveryStatus.SENT;
  }

  isDelivered(): boolean {
    return this.value === DeliveryStatus.DELIVERED;
  }

  isFailed(): boolean {
    return this.value === DeliveryStatus.FAILED;
  }

  isRetry(): boolean {
    return this.value === DeliveryStatus.RETRY;
  }

  /**
   * Check if this status indicates the notification was successfully processed
   */
  isSuccess(): boolean {
    return this.isSent() || this.isDelivered();
  }

  /**
   * Check if this status indicates the notification needs processing
   */
  needsProcessing(): boolean {
    return this.isPending() || this.isRetry();
  }

  /**
   * Check if this status is terminal (no more retries)
   */
  isTerminal(): boolean {
    return this.isDelivered() || this.isFailed();
  }

  /**
   * Get next status after successful delivery
   */
  transitionToSent(): DeliveryStatusVO {
    if (!this.isPending() && !this.isRetry()) {
      throw new Error(`Cannot transition from ${this.value} to sent`);
    }
    return DeliveryStatusVO.sent();
  }

  /**
   * Get next status after delivery confirmation
   */
  transitionToDelivered(): DeliveryStatusVO {
    if (!this.isSent()) {
      throw new Error(`Cannot transition from ${this.value} to delivered`);
    }
    return DeliveryStatusVO.delivered();
  }

  /**
   * Get next status after failure (for retry)
   */
  transitionToRetry(): DeliveryStatusVO {
    if (this.isTerminal()) {
      throw new Error(`Cannot retry from terminal status: ${this.value}`);
    }
    return DeliveryStatusVO.retry();
  }

  /**
   * Get next status after permanent failure
   */
  transitionToFailed(): DeliveryStatusVO {
    return DeliveryStatusVO.failed();
  }

  toString(): string {
    return this.value;
  }

  equals(other: DeliveryStatusVO): boolean {
    return this.value === other.value;
  }
}
