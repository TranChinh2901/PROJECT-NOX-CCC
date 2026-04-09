import { Request, Response } from 'express';
import { AppResponse } from '@/common/success.response';
import { HttpStatusCode } from '@/constants/status-code';
import adminUserService from './admin-user.service';
import { UpdateUserDto, BulkDeactivateDto } from './dto/admin-user.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { RoleType } from '@/modules/auth/enum/auth.enum';
import { AppError } from '@/common/error.response';
import { ErrorCode } from '@/constants/error-code';

class AdminUserController {
  async listUsers(req: Request, res: Response) {
    const query: PaginationQueryDto & { role?: RoleType } = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'ASC' | 'DESC',
      search: req.query.search as string,
      role: req.query.role as RoleType,
    };

    const result = await adminUserService.listUsers(query);

    return new AppResponse({
      message: 'Users retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: result
    }).sendResponse(res);
  }

  async getUser(req: Request, res: Response) {
    const id = parseInt(req.params.id);

    const user = await adminUserService.getUser(id);

    return new AppResponse({
      message: 'User retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: user
    }).sendResponse(res);
  }

  async updateUser(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const data: UpdateUserDto = req.body;

    const user = await adminUserService.updateUser(id, data);

    return new AppResponse({
      message: 'User updated successfully',
      statusCode: HttpStatusCode.OK,
      data: user
    }).sendResponse(res);
  }

  async uploadAvatar(req: Request, res: Response) {
    const id = parseInt(req.params.id);

    if (!req.file?.path) {
      throw new AppError(
        'Please upload an avatar image',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }

    const user = await adminUserService.uploadAvatar(id, req.file.path);

    return new AppResponse({
      message: 'User avatar updated successfully',
      statusCode: HttpStatusCode.OK,
      data: user
    }).sendResponse(res);
  }

  async deactivateUser(req: Request, res: Response) {
    const id = parseInt(req.params.id);

    await adminUserService.deactivateUser(id);

    return new AppResponse({
      message: 'User deactivated successfully',
      statusCode: HttpStatusCode.OK,
      data: null
    }).sendResponse(res);
  }

  async activateUser(req: Request, res: Response) {
    const id = parseInt(req.params.id);

    await adminUserService.activateUser(id);

    return new AppResponse({
      message: 'User activated successfully',
      statusCode: HttpStatusCode.OK,
      data: null
    }).sendResponse(res);
  }

  async bulkDeactivate(req: Request, res: Response) {
    const data: BulkDeactivateDto = req.body;

    const result = await adminUserService.bulkDeactivate(data);

    return new AppResponse({
      message: `${result.deactivated} users deactivated successfully`,
      statusCode: HttpStatusCode.OK,
      data: result
    }).sendResponse(res);
  }
}

export default new AdminUserController();
