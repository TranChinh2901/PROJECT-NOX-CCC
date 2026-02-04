import { Request, Response } from 'express';
import { AppResponse } from '@/common/success.response';
import { HttpStatusCode } from '@/constants/status-code';
import analyticsService from './analytics.service';

class AnalyticsController {
  async getSalesStats(req: Request, res: Response) {
    const startDate = new Date(req.query.start_date as string);
    const endDate = new Date(req.query.end_date as string);

    const stats = await analyticsService.getSalesStats(startDate, endDate);

    return new AppResponse({
      message: 'Sales statistics retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: stats
    }).sendResponse(res);
  }

  async getOrderStats(req: Request, res: Response) {
    const startDate = new Date(req.query.start_date as string);
    const endDate = new Date(req.query.end_date as string);

    const stats = await analyticsService.getOrderStats(startDate, endDate);

    return new AppResponse({
      message: 'Order statistics retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: stats
    }).sendResponse(res);
  }

  async getTopProducts(req: Request, res: Response) {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const products = await analyticsService.getTopProducts(limit);

    return new AppResponse({
      message: 'Top products retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: products
    }).sendResponse(res);
  }

  async getUserStats(req: Request, res: Response) {
    const startDate = new Date(req.query.start_date as string);
    const endDate = new Date(req.query.end_date as string);

    const stats = await analyticsService.getUserStats(startDate, endDate);

    return new AppResponse({
      message: 'User statistics retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: stats
    }).sendResponse(res);
  }
}

export default new AnalyticsController();
