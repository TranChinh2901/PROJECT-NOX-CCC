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

  async sendEmail(params: {
    to: string;
    subject: string;
    body: string;
    html?: string;
  }): Promise<boolean> {
    if (this.shouldFail) {
      throw new Error('Email service failed');
    }

    this.sentEmails.push(params);
    return true;
  }

  async sendBulkEmail(emails: Array<{
    to: string;
    subject: string;
    body: string;
    html?: string;
  }>): Promise<boolean> {
    if (this.shouldFail) {
      throw new Error('Bulk email service failed');
    }

    this.sentEmails.push(...emails);
    return true;
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

  async sendToUser(userId: number, event: string, data: any): Promise<boolean> {
    if (this.shouldFail) {
      throw new Error('WebSocket service failed');
    }

    if (!this.connectedUsers.has(userId)) {
      return false;
    }

    if (!this.sentMessages.has(userId)) {
      this.sentMessages.set(userId, []);
    }

    this.sentMessages.get(userId)!.push({ event, data });
    return true;
  }

  async sendToUsers(userIds: number[], event: string, data: any): Promise<void> {
    for (const userId of userIds) {
      await this.sendToUser(userId, event, data);
    }
  }

  async broadcast(event: string, data: any): Promise<void> {
    for (const userId of this.connectedUsers) {
      await this.sendToUser(userId, event, data);
    }
  }

  isConnected(userId: number): boolean {
    return this.connectedUsers.has(userId);
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

  async addJob(jobData: any, options?: any): Promise<void> {
    if (this.shouldFail) {
      throw new Error('Queue service failed');
    }

    this.queuedJobs.push({ data: jobData, options });
  }

  async processJobs(): Promise<void> {
    // Simulate job processing
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
