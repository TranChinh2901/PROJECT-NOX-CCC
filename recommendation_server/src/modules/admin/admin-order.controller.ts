import { Request, Response } from 'express';
import { AppResponse } from '@/common/success.response';
import { HttpStatusCode } from '@/constants/status-code';
import adminOrderService from './admin-order.service';
import { OrderFilterQueryDto, UpdateOrderStatusDto, AddInternalNoteDto } from './dto/order.dto';

class AdminOrderController {
  async listOrders(req: Request, res: Response) {
    const query: OrderFilterQueryDto = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'ASC' | 'DESC',
      search: req.query.search as string,
      status: req.query.status as any,
      payment_status: req.query.payment_status as any,
      user_id: req.query.user_id ? parseInt(req.query.user_id as string) : undefined,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
    };

    const result = await adminOrderService.listOrders(query);

    return new AppResponse({
      message: 'Orders retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: result
    }).sendResponse(res);
  }

  async getOrder(req: Request, res: Response) {
    const id = parseInt(req.params.id);

    const order = await adminOrderService.getOrder(id);

    return new AppResponse({
      message: 'Order retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: order
    }).sendResponse(res);
  }

  async updateOrderStatus(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const dto: UpdateOrderStatusDto = req.body;
    const adminEmail = (req as any).user?.email || 'admin';

    const order = await adminOrderService.updateOrderStatus(id, dto, adminEmail);

    return new AppResponse({
      message: 'Order status updated successfully',
      statusCode: HttpStatusCode.OK,
      data: order
    }).sendResponse(res);
  }

  async cancelOrder(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const adminEmail = (req as any).user?.email || 'admin';

    await adminOrderService.cancelOrder(id, adminEmail);

    return new AppResponse({
      message: 'Order cancelled successfully',
      statusCode: HttpStatusCode.OK,
      data: null
    }).sendResponse(res);
  }

  async deleteOrder(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const adminEmail = (req as any).user?.email || 'admin';

    await adminOrderService.deleteOrder(id, adminEmail);

    return new AppResponse({
      message: 'Order deleted successfully',
      statusCode: HttpStatusCode.OK,
      data: null
    }).sendResponse(res);
  }

  async addInternalNote(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const dto: AddInternalNoteDto = req.body;

    const order = await adminOrderService.addInternalNote(id, dto);

    return new AppResponse({
      message: 'Internal note added successfully',
      statusCode: HttpStatusCode.OK,
      data: order
    }).sendResponse(res);
  }
}

export default new AdminOrderController();
