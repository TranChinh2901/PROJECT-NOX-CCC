/**
 * Dependency Injection Container for Notification Module
 */
import { TypeORMNotificationRepository } from '../infrastructure/repositories/TypeORMNotificationRepository';
import { TypeORMPreferenceRepository } from '../infrastructure/repositories/TypeORMPreferenceRepository';
import { TypeORMTemplateRepository } from '../infrastructure/repositories/TypeORMTemplateRepository';
import { CachedNotificationRepository } from '../infrastructure/repositories/CachedNotificationRepository';
import { InMemoryWebSocketService } from '../infrastructure/services/InMemoryWebSocketService';
import { MockEmailService } from '../infrastructure/services/MockEmailService';
import { NotificationDeliveryService } from '../infrastructure/services/NotificationDeliveryService';
import { InMemoryQueueService } from '../infrastructure/services/InMemoryQueueService';

import { CreateNotificationUseCase } from '../application/use-cases/CreateNotificationUseCase';
import { GetUserNotificationsUseCase } from '../application/use-cases/GetUserNotificationsUseCase';
import { MarkAsReadUseCase } from '../application/use-cases/MarkAsReadUseCase';
import { UpdatePreferencesUseCase } from '../application/use-cases/UpdatePreferencesUseCase';
import { SendNotificationUseCase } from '../application/use-cases/SendNotificationUseCase';

class NotificationContainer {
  private static instance: NotificationContainer;
  private readonly webSocketService = new InMemoryWebSocketService();
  private readonly emailService = new MockEmailService();
  private readonly queueService = new InMemoryQueueService();
  
  private constructor() {}
  
  static getInstance(): NotificationContainer {
    if (!NotificationContainer.instance) {
      NotificationContainer.instance = new NotificationContainer();
    }
    return NotificationContainer.instance;
  }

  getNotificationRepository() {
    const baseRepo = new TypeORMNotificationRepository();
    return new CachedNotificationRepository(baseRepo);
  }

  getPreferenceRepository() {
    return new TypeORMPreferenceRepository();
  }

  getTemplateRepository() {
    return new TypeORMTemplateRepository();
  }

  getWebSocketService() {
    return this.webSocketService;
  }

  getEmailService() {
    return this.emailService;
  }

  getDeliveryService() {
    return new NotificationDeliveryService(
      this.getWebSocketService(),
      this.getEmailService()
    );
  }

  getQueueService() {
    return this.queueService;
  }

  getCreateNotificationUseCase() {
    return new CreateNotificationUseCase(
      this.getNotificationRepository(),
      this.getPreferenceRepository(),
      this.getDeliveryService()
    );
  }

  getGetUserNotificationsUseCase() {
    return new GetUserNotificationsUseCase(
      this.getNotificationRepository()
    );
  }

  getMarkAsReadUseCase() {
    return new MarkAsReadUseCase(
      this.getNotificationRepository(),
      this.getWebSocketService()
    );
  }

  getUpdatePreferencesUseCase() {
    return new UpdatePreferencesUseCase(
      this.getPreferenceRepository()
    );
  }

  getSendNotificationUseCase() {
    return new SendNotificationUseCase(
      this.getNotificationRepository(),
      this.getPreferenceRepository(),
      this.getTemplateRepository(),
      this.getDeliveryService()
    );
  }
}

export const container = NotificationContainer.getInstance();
