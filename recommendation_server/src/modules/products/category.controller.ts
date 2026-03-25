import { Request, Response } from 'express';
import { AppResponse } from '@/common/success.response';
import { HttpStatusCode } from '@/constants/status-code';
import categoryService from './category.service';

class CategoryController {
  async getAllCategories(req: Request, res: Response) {
    const categories = await categoryService.getAllCategories();

    return new AppResponse({
      message: 'Categories retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: categories
    }).sendResponse(res);
  }

  async getCategoryById(req: Request, res: Response) {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return new AppResponse({
        message: 'Invalid category ID',
        statusCode: HttpStatusCode.BAD_REQUEST,
        data: null
      }).sendResponse(res);
    }

    const category = await categoryService.getCategoryById(id);

    return new AppResponse({
      message: 'Category retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: category
    }).sendResponse(res);
  }

  async getCategoryBySlug(req: Request, res: Response) {
    const { slug } = req.params;

    if (!slug) {
      return new AppResponse({
        message: 'Category slug is required',
        statusCode: HttpStatusCode.BAD_REQUEST,
        data: null
      }).sendResponse(res);
    }

    const category = await categoryService.getCategoryBySlug(slug);

    return new AppResponse({
      message: 'Category retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: category
    }).sendResponse(res);
  }

  async getRootCategories(req: Request, res: Response) {
    const categories = await categoryService.getRootCategories();

    return new AppResponse({
      message: 'Root categories retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: categories
    }).sendResponse(res);
  }

  async getCategoryTree(req: Request, res: Response) {
    const tree = await categoryService.getCategoryTree();

    return new AppResponse({
      message: 'Category tree retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: tree
    }).sendResponse(res);
  }
}

export default new CategoryController();
