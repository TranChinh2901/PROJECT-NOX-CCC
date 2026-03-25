import { Request, Response } from 'express';
import { AppResponse } from '@/common/success.response';
import { HttpStatusCode } from '@/constants/status-code';
import adminBrandService from './admin-brand.service';
import { CreateBrandDto, UpdateBrandDto } from './dto/admin-brand.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

class AdminBrandController {
  async listBrands(req: Request, res: Response) {
    const query: PaginationQueryDto = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'ASC' | 'DESC',
      search: req.query.search as string,
    };

    const result = await adminBrandService.listBrands(query);

    return new AppResponse({
      message: 'Brands retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: result
    }).sendResponse(res);
  }

  async getBrand(req: Request, res: Response) {
    const id = parseInt(req.params.id);

    const brand = await adminBrandService.getBrand(id);

    return new AppResponse({
      message: 'Brand retrieved successfully',
      statusCode: HttpStatusCode.OK,
      data: brand
    }).sendResponse(res);
  }

  async createBrand(req: Request, res: Response) {
    const data: CreateBrandDto = req.body;

    const brand = await adminBrandService.createBrand(data);

    return new AppResponse({
      message: 'Brand created successfully',
      statusCode: HttpStatusCode.CREATED,
      data: brand
    }).sendResponse(res);
  }

  async updateBrand(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const data: UpdateBrandDto = req.body;

    const brand = await adminBrandService.updateBrand(id, data);

    return new AppResponse({
      message: 'Brand updated successfully',
      statusCode: HttpStatusCode.OK,
      data: brand
    }).sendResponse(res);
  }

  async deleteBrand(req: Request, res: Response) {
    const id = parseInt(req.params.id);

    await adminBrandService.deleteBrand(id);

    return new AppResponse({
      message: 'Brand deleted successfully',
      statusCode: HttpStatusCode.OK,
      data: null
    }).sendResponse(res);
  }
}

export default new AdminBrandController();
