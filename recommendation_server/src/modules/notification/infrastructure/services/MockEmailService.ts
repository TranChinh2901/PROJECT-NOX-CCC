/**
 * Infrastructure: Mock Email Service
 * Implements IEmailService with console logging (for development)
 * Note: For production, implement with SendGrid, AWS SES, etc.
 */
import { IEmailService, EmailContent, EmailResult } from '../../domain/services/IEmailService';

export class MockEmailService implements IEmailService {
  private sentEmails: EmailContent[] = [];

  async send(content: EmailContent): Promise<EmailResult> {
    console.log(`[MockEmailService] Sending email to ${content.to}`);
    console.log(`  Subject: ${content.subject}`);
    console.log(`  Body: ${content.body.substring(0, 100)}...`);

    // Simulate network delay
    await this.delay(100);

    // Store for testing
    this.sentEmails.push(content);

    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  async sendBulk(contents: EmailContent[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];

    for (const content of contents) {
      const result = await this.send(content);
      results.push(result);
    }

    return results;
  }

  async sendNotificationEmail(
    email: string,
    subject: string,
    message: string,
    actionUrl?: string,
  ): Promise<EmailResult> {
    const htmlBody = this.buildNotificationEmailHtml(subject, message, actionUrl);

    return this.send({
      to: email,
      subject,
      body: message,
      html: htmlBody,
    });
  }

  async sendDigestEmail(
    email: string,
    notifications: Array<{ title: string; message: string; actionUrl?: string }>,
  ): Promise<EmailResult> {
    const subject = `You have ${notifications.length} new notification${notifications.length > 1 ? 's' : ''}`;
    const body = notifications.map(n => `${n.title}: ${n.message}`).join('\n\n');
    const htmlBody = this.buildDigestEmailHtml(notifications);

    return this.send({
      to: email,
      subject,
      body,
      html: htmlBody,
    });
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  /**
   * Build HTML email template for single notification
   */
  private buildNotificationEmailHtml(
    title: string,
    message: string,
    actionUrl?: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; }
    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      <p>${message}</p>
      ${actionUrl ? `<p><a href="${actionUrl}" class="button">View Details</a></p>` : ''}
    </div>
    <div class="footer">
      <p>You received this email because you have notifications enabled for your account.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Build HTML email template for digest
   */
  private buildDigestEmailHtml(
    notifications: Array<{ title: string; message: string; actionUrl?: string }>,
  ): string {
    const notificationHtml = notifications
      .map(
        n => `
        <div style="border-bottom: 1px solid #e5e7eb; padding: 15px 0;">
          <h3 style="margin: 0 0 8px 0; color: #111827;">${n.title}</h3>
          <p style="margin: 0 0 8px 0; color: #4b5563;">${n.message}</p>
          ${n.actionUrl ? `<a href="${n.actionUrl}" style="color: #4F46E5;">View Details</a>` : ''}
        </div>
      `,
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Notification Digest</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #4F46E5; color: white; padding: 20px; text-align: center;">
      <h1 style="margin: 0;">Your Notification Digest</h1>
    </div>
    <div style="padding: 20px; background: #f9fafb;">
      <p>You have ${notifications.length} new notification${notifications.length > 1 ? 's' : ''}:</p>
      ${notificationHtml}
    </div>
    <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
      <p>You received this email because you have email digest enabled for your account.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Helper to simulate async delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get sent emails (for testing)
   */
  getSentEmails(): EmailContent[] {
    return this.sentEmails;
  }

  /**
   * Clear sent emails (for testing)
   */
  clearSentEmails(): void {
    this.sentEmails = [];
  }
}
