import { QueryFailedError, Repository } from 'typeorm';
import { AppDataSource } from '@/config/database.config';
import { SiteNavigationItem } from '@/modules/navigation/entity/site-navigation-item';
import { logger } from '@/utils/logger';

export class NavigationService {
  private navigationRepository: Repository<SiteNavigationItem>;

  constructor() {
    this.navigationRepository = AppDataSource.getRepository(SiteNavigationItem);
  }

  async getNavigationItems(location: string = 'header_primary') {
    try {
      return await this.navigationRepository.find({
        where: {
          location,
          is_active: true,
        },
        order: {
          sort_order: 'ASC',
          id: 'ASC',
        },
      });
    } catch (error) {
      const isMissingTableError =
        error instanceof QueryFailedError &&
        typeof (error as QueryFailedError & { code?: string }).code === 'string' &&
        (error as QueryFailedError & { code?: string }).code === 'ER_NO_SUCH_TABLE';

      if (isMissingTableError) {
        logger.error(
          'Table `site_navigation_items` is missing. Run `npm run migration:run` to apply pending migrations.'
        );
        return [];
      }

      throw error;
    }
  }
}

export default new NavigationService();
