import { Request, Response } from 'express';
import { AppResponse } from '@/common/success.response';
import { HttpStatusCode } from '@/constants/status-code';
import adminProductService from './admin-product.service';
import { CreateProductDto, UpdateProductDto } from './dto/admin-product.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { BulkOperationDto } from './dto/bulk-operation.dto';

class AdminProductController {
  async listProducts(req: Request, res: Response) {
    const query: PaginationQueryDto = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'ASC' | 'DESC',
      search: req.query.search as string,
    };

    const result = await adminProductService.listProducts(query);

    return new AppResponse({
      message: 'Products retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: result
    }).sendResponse(res);
  }

  async getProduct(req: Request, res: Response) {
    const id = parseInt(req.params.id);

    const product = await adminProductService.getProduct(id);

    return new AppResponse({
      message: 'Product retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: product
    }).sendResponse(res);
  }

  async createProduct(req: Request, res: Response) {
    const data: CreateProductDto = req.body;

    const product = await adminProductService.createProduct(data);

    return new AppResponse({
      message: 'Product created successfully',
      statusCode: HttpStatusCode.CREATED,
      data: product
    }).sendResponse(res);
  }

  async updateProduct(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const data: UpdateProductDto = req.body;

    const product = await adminProductService.updateProduct(id, data);

    return new AppResponse({
      message: 'Product updated successfully',
      statusCode: HttpStatusCode.OK,
      data: product
    }).sendResponse(res);
  }

  async deleteProduct(req: Request, res: Response) {
    const id = parseInt(req.params.id);

    await adminProductService.deleteProduct(id);

    return new AppResponse({
      message: 'Product deleted successfully',
      statusCode: HttpStatusCode.OK,
      data: null
    }).sendResponse(res);
  }

  async bulkDelete(req: Request, res: Response) {
    const { ids }: BulkOperationDto = req.body;

    const result = await adminProductService.bulkDelete(ids);

    return new AppResponse({
      message: `${result.deleted} products deleted successfully`,
      statusCode: HttpStatusCode.OK,
      data: result
    }).sendResponse(res);
  }
}

export default new AdminProductController();
