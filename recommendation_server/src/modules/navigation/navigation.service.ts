import { Repository } from 'typeorm';
import { AppDataSource } from '@/config/database.config';
import { SiteNavigationItem } from '@/modules/navigation/entity/site-navigation-item';

export class NavigationService {
  private navigationRepository: Repository<SiteNavigationItem>;

  constructor() {
    this.navigationRepository = AppDataSource.getRepository(SiteNavigationItem);
  }

  async getNavigationItems(location: string = 'header_primary') {
    return this.navigationRepository.find({
      where: {
        location,
        is_active: true,
      },
      order: {
        sort_order: 'ASC',
        id: 'ASC',
      },
    });
  }
}

export default new NavigationService();
