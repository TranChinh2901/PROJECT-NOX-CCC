import { Repository, IsNull } from "typeorm";
import { AppDataSource } from "@/config/database.config";
import { Brand } from "@/modules/products/entity/brand";
import { Product } from "@/modules/products/entity/product";
import { AppError } from "@/common/error.response";
import { HttpStatusCode } from "@/constants/status-code";
import { ErrorCode } from "@/constants/error-code";
import { PaginationQueryDto } from "@/modules/admin/dto/pagination-query.dto";
import { CreateBrandDto, UpdateBrandDto } from "@/modules/admin/dto/admin-brand.dto";

export class AdminBrandService {
  private brandRepository: Repository<Brand>;
  private productRepository: Repository<Product>;

  constructor() {
    this.brandRepository = AppDataSource.getRepository(Brand);
    this.productRepository = AppDataSource.getRepository(Product);
  }

  async listBrands(query: PaginationQueryDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      search = ''
    } = query;

    let queryBuilder = this.brandRepository
      .createQueryBuilder('brand')
      .withDeleted(); // Include soft-deleted items for admin

    // Search filter
    if (search) {
      queryBuilder = queryBuilder.andWhere(
        '(brand.name LIKE :search OR brand.slug LIKE :search OR brand.description LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Sorting
    const validSortColumns = ['created_at', 'updated_at', 'name', 'is_active'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    queryBuilder = queryBuilder.orderBy(`brand.${sortColumn}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder = queryBuilder.skip(skip).take(limit);

    const brands = await queryBuilder.getMany();

    return {
      data: brands.map(brand => this.formatBrandResponse(brand)),
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      }
    };
  }

  async getBrand(id: number) {
    const brand = await this.brandRepository.findOne({
      where: { id },
      withDeleted: true // Include soft-deleted for admin
    });

    if (!brand) {
      throw new AppError(
        'Brand not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.BRAND_NOT_FOUND
      );
    }

    return this.formatBrandResponse(brand);
  }

  async createBrand(data: CreateBrandDto) {
    // Check slug uniqueness
    const existingSlug = await this.brandRepository.findOne({
      where: { slug: data.slug }
    });
    if (existingSlug) {
      throw new AppError(
        'Brand slug already exists',
        HttpStatusCode.CONFLICT,
        ErrorCode.BRAND_ALREADY_EXISTS
      );
    }

    // Create brand
    const brand = this.brandRepository.create(data);
    const savedBrand = await this.brandRepository.save(brand);

    return this.formatBrandResponse(savedBrand);
  }

  async updateBrand(id: number, data: UpdateBrandDto) {
    const brand = await this.brandRepository.findOne({
      where: { id }
    });

    if (!brand) {
      throw new AppError(
        'Brand not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.BRAND_NOT_FOUND
      );
    }

    // Check slug uniqueness if being updated
    if (data.slug && data.slug !== brand.slug) {
      const existingSlug = await this.brandRepository.findOne({
        where: { slug: data.slug }
      });
      if (existingSlug) {
        throw new AppError(
          'Brand slug already exists',
          HttpStatusCode.CONFLICT,
          ErrorCode.BRAND_ALREADY_EXISTS
        );
      }
    }

    // Update brand
    Object.assign(brand, data);
    const updatedBrand = await this.brandRepository.save(brand);

    return this.formatBrandResponse(updatedBrand);
  }

  async deleteBrand(id: number): Promise<void> {
    const brand = await this.brandRepository.findOne({
      where: { id }
    });

    if (!brand) {
      throw new AppError(
        'Brand not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.BRAND_NOT_FOUND
      );
    }

    // Check if brand has active products
    const productCount = await this.productRepository.count({
      where: { brand_id: id, deleted_at: IsNull() }
    });

    if (productCount > 0) {
      throw new AppError(
        'Cannot delete brand with active products',
        HttpStatusCode.CONFLICT,
        ErrorCode.BRAND_IN_USE
      );
    }

    // Soft-delete brand
    await this.brandRepository.softDelete(id);
  }

  private formatBrandResponse(brand: Brand) {
    return {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      logo_url: brand.logo_url,
      website_url: brand.website_url,
      is_active: brand.is_active,
      deleted_at: brand.deleted_at,
      created_at: brand.created_at,
      updated_at: brand.updated_at
    };
  }
}

export default new AdminBrandService();
