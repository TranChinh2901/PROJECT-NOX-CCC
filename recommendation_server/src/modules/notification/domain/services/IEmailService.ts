/**
 * Service Interface: IEmailService
 * Defines the contract for email delivery
 */

export interface EmailContent {
  to: string;
  subject: string;
  body: string;
  html?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IEmailService {
  /**
   * Send a single email
   */
  send(content: EmailContent): Promise<EmailResult>;

  /**
   * Send email to multiple recipients
   */
  sendBulk(contents: EmailContent[]): Promise<EmailResult[]>;

  /**
   * Send notification email using template
   */
  sendNotificationEmail(
    email: string,
    subject: string,
    message: string,
    actionUrl?: string,
  ): Promise<EmailResult>;

  /**
   * Send digest email with multiple notifications
   */
  sendDigestEmail(
    email: string,
    notifications: Array<{ title: string; message: string; actionUrl?: string }>,
  ): Promise<EmailResult>;

  /**
   * Validate email address
   */
  validateEmail(email: string): boolean;

  /**
   * Check if service is available
   */
  isAvailable(): Promise<boolean>;
}
