/**
 * Dependency Injection Container for Notification Module
 */
import { AppDataSource } from '@/config/data-source';
import { NotificationEntity } from '../entity/Notification.entity';
import { NotificationPreferenceEntity } from '../entity/NotificationPreference.entity';
import { NotificationTemplateEntity } from '../entity/NotificationTemplate.entity';

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
  
  private constructor() {}
  
  static getInstance(): NotificationContainer {
    if (!NotificationContainer.instance) {
      NotificationContainer.instance = new NotificationContainer();
    }
    return NotificationContainer.instance;
  }

  getNotificationRepository() {
    const ormRepo = AppDataSource.getRepository(NotificationEntity);
    const baseRepo = new TypeORMNotificationRepository(ormRepo);
    return new CachedNotificationRepository(baseRepo);
  }

  getPreferenceRepository() {
    const ormRepo = AppDataSource.getRepository(NotificationPreferenceEntity);
    return new TypeORMPreferenceRepository(ormRepo);
  }

  getTemplateRepository() {
    const ormRepo = AppDataSource.getRepository(NotificationTemplateEntity);
    return new TypeORMTemplateRepository(ormRepo);
  }

  getWebSocketService() {
    return new InMemoryWebSocketService();
  }

  getEmailService() {
    return new MockEmailService();
  }

  getDeliveryService() {
    return new NotificationDeliveryService(
      this.getWebSocketService(),
      this.getEmailService(),
      this.getPreferenceRepository(),
      this.getQueueService()
    );
  }

  getQueueService() {
    return new InMemoryQueueService();
  }

  getCreateNotificationUseCase() {
    return new CreateNotificationUseCase(
      this.getNotificationRepository(),
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
      this.getNotificationRepository()
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
      this.getTemplateRepository(),
      this.getDeliveryService()
    );
  }
}

export const container = NotificationContainer.getInstance();
