/**
 * Service Mocks for Testing
 * Provides mock implementations of external services
 */
import { IEmailService } from '../../domain/services/IEmailService';
import { IWebSocketService } from '../../domain/services/IWebSocketService';
import { INotificationQueueService } from '../../domain/services/INotificationQueueService';

export class MockEmailService implements IEmailService {
  public sentEmails: any[] = [];
  public shouldFail = false;

  async send(content: any): Promise<any> {
    if (this.shouldFail) {
      throw new Error('Email service failed');
    }
    this.sentEmails.push(content);
    return { success: true, messageId: 'mock-id' };
  }

  async sendEmail(emailData: { to: string; subject: string; body: string; html?: string }): Promise<boolean> {
    if (this.shouldFail) {
      throw new Error('Email service failed');
    }
    this.sentEmails.push(emailData);
    return true;
  }

  async sendBulk(contents: any[]): Promise<any[]> {
    if (this.shouldFail) {
      throw new Error('Bulk email service failed');
    }
    this.sentEmails.push(...contents);
    return contents.map(() => ({ success: true, messageId: 'mock-id' }));
  }

  async sendBulkEmail(emailBatch: any[]): Promise<void> {
    if (this.shouldFail) {
      throw new Error('Bulk email service failed');
    }
    this.sentEmails.push(...emailBatch);
  }

  async sendNotificationEmail(email: string, subject: string, message: string, actionUrl?: string): Promise<any> {
    if (this.shouldFail) {
      throw new Error('Email service failed');
    }
    this.sentEmails.push({ email, subject, message, actionUrl });
    return { success: true, messageId: 'mock-id' };
  }

  async sendDigestEmail(email: string, notifications: any[]): Promise<any> {
    if (this.shouldFail) {
      throw new Error('Email service failed');
    }
    this.sentEmails.push({ email, notifications });
    return { success: true, messageId: 'mock-id' };
  }

  validateEmail(email: string): boolean {
    return email.includes('@');
  }

  async isAvailable(): Promise<boolean> {
    return !this.shouldFail;
  }

  reset(): void {
    this.sentEmails = [];
    this.shouldFail = false;
  }
}

export class MockWebSocketService implements IWebSocketService {
  public sentMessages: Map<number, any[]> = new Map();
  public connectedUsers: Set<number> = new Set();
  public shouldFail = false;

  isUserConnected(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }

  getUserSockets(userId: number): string[] {
    return this.connectedUsers.has(userId) ? [`socket-${userId}`] : [];
  }

  getConnectionInfo(userId: number): any[] {
    if (!this.connectedUsers.has(userId)) return [];
    return [{ userId, socketId: `socket-${userId}`, connectedAt: new Date() }];
  }

  async sendToUser(userId: number, notificationOrEvent: any, data?: any): Promise<boolean> {
    if (this.shouldFail) {
      throw new Error('WebSocket service failed');
    }

    if (!this.connectedUsers.has(userId)) {
      return false;
    }

    if (!this.sentMessages.has(userId)) {
      this.sentMessages.set(userId, []);
    }

    if (data !== undefined) {
      this.sentMessages.get(userId)!.push({ event: notificationOrEvent, data });
    } else {
      this.sentMessages.get(userId)!.push(notificationOrEvent);
    }
    return true;
  }

  async sendToUsers(userIds: number[], notification: any): Promise<Map<number, boolean>> {
    const results = new Map<number, boolean>();
    for (const userId of userIds) {
      results.set(userId, await this.sendToUser(userId, notification));
    }
    return results;
  }

  async broadcast(notification: any): Promise<void> {
    for (const userId of this.connectedUsers) {
      await this.sendToUser(userId, notification);
    }
  }

  async sendUnreadCount(userId: number, count: number): Promise<boolean> {
    return this.sendToUser(userId, { type: 'unreadCount', count });
  }

  async sendMarkAsReadConfirmation(userId: number, notificationIds: number[]): Promise<boolean> {
    return this.sendToUser(userId, { type: 'markAsRead', notificationIds });
  }

  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  async disconnectUser(userId: number): Promise<void> {
    this.connectedUsers.delete(userId);
    this.sentMessages.delete(userId);
  }

  connect(userId: number): void {
    this.connectedUsers.add(userId);
  }

  disconnect(userId: number): void {
    this.connectedUsers.delete(userId);
    this.sentMessages.delete(userId);
  }

  reset(): void {
    this.sentMessages.clear();
    this.connectedUsers.clear();
    this.shouldFail = false;
  }
}

export class MockQueueService implements INotificationQueueService {
  public queuedJobs: any[] = [];
  public shouldFail = false;

  async addCreationJob(notification: any, priority?: string): Promise<string> {
    if (this.shouldFail) {
      throw new Error('Queue service failed');
    }
    const jobId = `job-${Date.now()}`;
    this.queuedJobs.push({ id: jobId, type: 'creation', notification, priority });
    return jobId;
  }

  async addDeliveryJob(notificationId: number, userId: number, channels: any[], priority?: string): Promise<string> {
    if (this.shouldFail) {
      throw new Error('Queue service failed');
    }
    const jobId = `job-${Date.now()}`;
    this.queuedJobs.push({ id: jobId, type: 'delivery', notificationId, userId, channels, priority });
    return jobId;
  }

  async addEmailRetryJob(notificationId: number, email: string, attempt: number, delayMs?: number): Promise<string> {
    if (this.shouldFail) {
      throw new Error('Queue service failed');
    }
    const jobId = `job-${Date.now()}`;
    this.queuedJobs.push({ id: jobId, type: 'emailRetry', notificationId, email, attempt, delayMs });
    return jobId;
  }

  async addBulkCreationJob(notifications: any[]): Promise<string[]> {
    if (this.shouldFail) {
      throw new Error('Queue service failed');
    }
    return notifications.map((n, i) => {
      const jobId = `job-${Date.now()}-${i}`;
      this.queuedJobs.push({ id: jobId, type: 'bulkCreation', notification: n });
      return jobId;
    });
  }

  async getJobStatus(jobId: string): Promise<any> {
    const job = this.queuedJobs.find(j => j.id === jobId);
    return job || null;
  }

  async removeJob(jobId: string): Promise<boolean> {
    const index = this.queuedJobs.findIndex(j => j.id === jobId);
    if (index >= 0) {
      this.queuedJobs.splice(index, 1);
      return true;
    }
    return false;
  }

  async getQueueStats(): Promise<any> {
    return {
      waiting: this.queuedJobs.length,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    };
  }

  async pause(): Promise<void> {
  }

  async resume(): Promise<void> {
  }

  async cleanCompleted(olderThanMs?: number): Promise<number> {
    return 0;
  }

  async addJob(jobData: any, options?: any): Promise<void> {
    await this.addCreationJob(jobData, options?.priority);
  }

  async processJobs(): Promise<void> {
    this.queuedJobs = [];
  }

  reset(): void {
    this.queuedJobs = [];
    this.shouldFail = false;
  }
}

export const createMockServices = () => ({
  emailService: new MockEmailService(),
  webSocketService: new MockWebSocketService(),
  queueService: new MockQueueService(),
});
