/**
 * Repository Interface: ITemplateRepository
 * Defines the contract for notification templates persistence.
 */
import { NotificationType } from '../../enum/notification.enum';

export interface NotificationTemplateData {
  id: number;
  type: NotificationType;
  name: string;
  titleTemplate: string;
  messageTemplate: string;
  emailSubjectTemplate?: string;
  emailBodyTemplate?: string;
  defaultData?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITemplateRepository {
  /**
   * Find template by ID
   */
  findById(id: number): Promise<NotificationTemplateData | null>;

  /**
   * Find active template by type
   */
  findByType(type: NotificationType): Promise<NotificationTemplateData | null>;

  /**
   * Find all templates
   */
  findAll(activeOnly?: boolean): Promise<NotificationTemplateData[]>;

  /**
   * Save a template
   */
  save(template: Omit<NotificationTemplateData, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplateData>;

  /**
   * Update a template
   */
  update(id: number, template: Partial<NotificationTemplateData>): Promise<NotificationTemplateData | null>;

  /**
   * Delete a template
   */
  delete(id: number): Promise<boolean>;

  /**
   * Render a template with data
   */
  render(
    type: NotificationType,
    data: Record<string, any>,
  ): Promise<{
    title: string;
    message: string;
    emailSubject?: string;
    emailBody?: string;
  } | null>;
}
