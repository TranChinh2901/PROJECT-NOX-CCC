import { Request, Response } from 'express';
import { AppResponse } from '@/common/success.response';
import { HttpStatusCode } from '@/constants/status-code';
import adminProductService from './admin-product.service';
import { AdminProductListQueryDto, CreateProductDto, UpdateProductDto } from './dto/admin-product.dto';
import { BulkOperationDto } from './dto/bulk-operation.dto';
import { AppError } from '@/common/error.response';
import { ErrorCode } from '@/constants/error-code';

class AdminProductController {
  async listProducts(req: Request, res: Response) {
    const query: AdminProductListQueryDto = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'ASC' | 'DESC',
      search: req.query.search as string,
      category_id: req.query.category_id ? parseInt(req.query.category_id as string) : undefined,
      brand_id: req.query.brand_id ? parseInt(req.query.brand_id as string) : undefined,
      is_active:
        req.query.is_active === undefined
          ? undefined
          : req.query.is_active === 'true',
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

  async uploadProductImages(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];

    if (!files.length) {
      throw new AppError(
        'Please upload at least one image file',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }

    const uploadedImages = await adminProductService.uploadProductImages(id, files, {
      variant_id: req.body.variant_id ? parseInt(req.body.variant_id) : undefined,
      alt_text: req.body.alt_text,
      is_primary: ['true', '1', true].includes(req.body.is_primary),
      sort_order: req.body.sort_order !== undefined ? parseInt(req.body.sort_order) : undefined,
    });

    return new AppResponse({
      message: 'Product images uploaded successfully',
      statusCode: HttpStatusCode.CREATED,
      data: uploadedImages
    }).sendResponse(res);
  }

  async deleteProductImage(req: Request, res: Response) {
    const productId = parseInt(req.params.id);
    const imageId = parseInt(req.params.imageId);

    await adminProductService.deleteProductImage(productId, imageId);

    return new AppResponse({
      message: 'Product image deleted successfully',
      statusCode: HttpStatusCode.OK,
      data: null
    }).sendResponse(res);
  }
}

export default new AdminProductController();
