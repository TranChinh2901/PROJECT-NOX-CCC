import { Request, Response } from 'express';
import { AppResponse } from '@/common/success.response';
import { HttpStatusCode } from '@/constants/status-code';
import adminCategoryService from './admin-category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/admin-category.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

class AdminCategoryController {
  async listCategories(req: Request, res: Response) {
    const query: PaginationQueryDto = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'ASC' | 'DESC',
      search: req.query.search as string,
    };

    const result = await adminCategoryService.listCategories(query);

    return new AppResponse({
      message: 'Categories retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: result
    }).sendResponse(res);
  }

  async getCategoryTree(req: Request, res: Response) {
    const tree = await adminCategoryService.getCategoryTree();

    return new AppResponse({
      message: 'Category tree retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: tree
    }).sendResponse(res);
  }

  async getCategory(req: Request, res: Response) {
    const id = parseInt(req.params.id);

    const category = await adminCategoryService.getCategory(id);
    return new AppResponse({
      message: 'Category retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: category
    }).sendResponse(res);
  }

  async createCategory(req: Request, res: Response) {
    const data: CreateCategoryDto = req.body;
    const category = await adminCategoryService.createCategory(data);
    return new AppResponse({
      message: 'Category created successfully',
      statusCode: HttpStatusCode.CREATED,
      data: category
    }).sendResponse(res);
  }

  async updateCategory(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const data: UpdateCategoryDto = req.body;

    const category = await adminCategoryService.updateCategory(id, data);

    return new AppResponse({
      message: 'Category updated successfully',
      statusCode: HttpStatusCode.OK,
      data: category
    }).sendResponse(res);
  }

  async deleteCategory(req: Request, res: Response) {
    const id = parseInt(req.params.id);

    await adminCategoryService.deleteCategory(id);

    return new AppResponse({
      message: 'Category deleted successfully',
      statusCode: HttpStatusCode.OK,
      data: null
    }).sendResponse(res);
  }
}

export default new AdminCategoryController();
