import { Request, Response } from 'express';
import { AppResponse } from '@/common/success.response';
import { HttpStatusCode } from '@/constants/status-code';
import productService, { ProductFilterOptions } from './product.service';

class ProductController {
  async getAllProducts(req: Request, res: Response) {
    const options: ProductFilterOptions = {
      category_id: req.query.category_id ? parseInt(req.query.category_id as string) : undefined,
      brand_id: req.query.brand_id ? parseInt(req.query.brand_id as string) : undefined,
      min_price: req.query.min_price ? parseFloat(req.query.min_price as string) : undefined,
      max_price: req.query.max_price ? parseFloat(req.query.max_price as string) : undefined,
      search: req.query.search as string,
      is_featured: req.query.is_featured === 'true' ? true : undefined,
      is_active: req.query.is_active === 'false' ? false : true,
      sort: req.query.sort as ProductFilterOptions['sort'],
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20
    };

    const result = await productService.getAllProducts(options);

    return new AppResponse({
      message: 'Products retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: result
    }).sendResponse(res);
  }

  async getProductById(req: Request, res: Response) {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return new AppResponse({
        message: 'Invalid product ID',
        statusCode: HttpStatusCode.BAD_REQUEST,
        data: null
      }).sendResponse(res);
    }

    const product = await productService.getProductById(id);

    return new AppResponse({
      message: 'Product retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: product
    }).sendResponse(res);
  }

  async getProductBySlug(req: Request, res: Response) {
    const { slug } = req.params;

    if (!slug) {
      return new AppResponse({
        message: 'Product slug is required',
        statusCode: HttpStatusCode.BAD_REQUEST,
        data: null
      }).sendResponse(res);
    }

    const product = await productService.getProductBySlug(slug);

    return new AppResponse({
      message: 'Product retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: product
    }).sendResponse(res);
  }

  async getFeaturedProducts(req: Request, res: Response) {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const products = await productService.getFeaturedProducts(limit);

    return new AppResponse({
      message: 'Featured products retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: products
    }).sendResponse(res);
  }

  async getRelatedProducts(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 8;

    if (isNaN(id)) {
      return new AppResponse({
        message: 'Invalid product ID',
        statusCode: HttpStatusCode.BAD_REQUEST,
        data: null
      }).sendResponse(res);
    }

    const products = await productService.getRelatedProducts(id, limit);

    return new AppResponse({
      message: 'Related products retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: products
    }).sendResponse(res);
  }

  async searchProducts(req: Request, res: Response) {
    const query = req.query.q as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    if (!query || query.trim().length < 2) {
      return new AppResponse({
        message: 'Search query must be at least 2 characters',
        statusCode: HttpStatusCode.BAD_REQUEST,
        data: { data: [], suggestions: [] }
      }).sendResponse(res);
    }

    const result = await productService.searchProducts(query, limit);

    return new AppResponse({
      message: 'Search results retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: result
    }).sendResponse(res);
  }
}

export default new ProductController();
