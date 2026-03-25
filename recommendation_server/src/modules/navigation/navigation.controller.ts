import { Request, Response } from 'express';
import { AppResponse } from '@/common/success.response';
import { HttpStatusCode } from '@/constants/status-code';
import navigationService from '@/modules/navigation/navigation.service';

class NavigationController {
  async getHeaderNavigation(req: Request, res: Response) {
    const location = typeof req.query.location === 'string' ? req.query.location : 'header_primary';
    const items = await navigationService.getNavigationItems(location);

    return new AppResponse({
      message: 'Navigation items retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: items,
    }).sendResponse(res);
  }
}

export default new NavigationController();
