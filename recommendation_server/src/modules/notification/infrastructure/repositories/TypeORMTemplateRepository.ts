/**
 * Infrastructure: TypeORM Template Repository
 * Implements ITemplateRepository using TypeORM
 */
import { Repository } from 'typeorm';
import { ITemplateRepository, NotificationTemplateData } from '../../domain/repositories/ITemplateRepository';
import { NotificationTemplate as TemplateEntity } from '../../entity/notification-template';
import { NotificationType } from '../../enum/notification.enum';
import { AppDataSource } from '@/config/database.config';

export class TypeORMTemplateRepository implements ITemplateRepository {
  private repository: Repository<TemplateEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(TemplateEntity);
  }

  async findById(id: number): Promise<NotificationTemplateData | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return null;
    return this.toData(entity);
  }

  async findByType(type: NotificationType): Promise<NotificationTemplateData | null> {
    const entity = await this.repository.findOne({
      where: { type, is_active: true },
      order: { created_at: 'DESC' },
    });
    if (!entity) return null;
    return this.toData(entity);
  }

  async findAll(activeOnly: boolean = true): Promise<NotificationTemplateData[]> {
    const where = activeOnly ? { is_active: true } : {};
    const entities = await this.repository.find({
      where,
      order: { type: 'ASC', created_at: 'DESC' },
    });
    return entities.map(e => this.toData(e));
  }

  async save(
    template: Omit<NotificationTemplateData, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<NotificationTemplateData> {
    const entity = this.repository.create({
      type: template.type,
      name: template.name,
      title_template: template.titleTemplate,
      message_template: template.messageTemplate,
      email_subject_template: template.emailSubjectTemplate,
      email_body_template: template.emailBodyTemplate,
      default_data: template.defaultData,
      is_active: template.isActive,
    });

    const saved = await this.repository.save(entity);
    return this.toData(saved);
  }

  async update(
    id: number,
    template: Partial<NotificationTemplateData>,
  ): Promise<NotificationTemplateData | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return null;

    if (template.name !== undefined) entity.name = template.name;
    if (template.titleTemplate !== undefined) entity.title_template = template.titleTemplate;
    if (template.messageTemplate !== undefined) entity.message_template = template.messageTemplate;
    if (template.emailSubjectTemplate !== undefined)
      entity.email_subject_template = template.emailSubjectTemplate;
    if (template.emailBodyTemplate !== undefined)
      entity.email_body_template = template.emailBodyTemplate;
    if (template.defaultData !== undefined) entity.default_data = template.defaultData;
    if (template.isActive !== undefined) entity.is_active = template.isActive;

    const saved = await this.repository.save(entity);
    return this.toData(saved);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete({ id });
    return (result.affected || 0) > 0;
  }

  async render(
    type: NotificationType,
    data: Record<string, any>,
  ): Promise<{ title: string; message: string; emailSubject?: string; emailBody?: string } | null> {
    const template = await this.findByType(type);
    if (!template) return null;

    // Merge default data with provided data
    const mergedData = { ...template.defaultData, ...data };

    return {
      title: this.interpolate(template.titleTemplate, mergedData),
      message: this.interpolate(template.messageTemplate, mergedData),
      emailSubject: template.emailSubjectTemplate
        ? this.interpolate(template.emailSubjectTemplate, mergedData)
        : undefined,
      emailBody: template.emailBodyTemplate
        ? this.interpolate(template.emailBodyTemplate, mergedData)
        : undefined,
    };
  }

  /**
   * Simple template interpolation
   * Replaces {{variable}} with data[variable]
   */
  private interpolate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = data[key];
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Convert TypeORM entity to data object
   */
  private toData(entity: TemplateEntity): NotificationTemplateData {
    return {
      id: entity.id,
      type: entity.type,
      name: entity.name,
      titleTemplate: entity.title_template,
      messageTemplate: entity.message_template,
      emailSubjectTemplate: entity.email_subject_template,
      emailBodyTemplate: entity.email_body_template,
      defaultData: entity.default_data,
      isActive: entity.is_active,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }
}
