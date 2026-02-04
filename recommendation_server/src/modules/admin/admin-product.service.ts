import { Repository, DataSource } from "typeorm";
import { AppDataSource } from "@/config/database.config";
import { Product } from "@/modules/products/entity/product";
import { ProductVariant } from "@/modules/products/entity/product-variant";
import { ProductImage } from "@/modules/products/entity/product-image";
import { Category } from "@/modules/products/entity/category";
import { Brand } from "@/modules/products/entity/brand";
import { AppError } from "@/common/error.response";
import { HttpStatusCode } from "@/constants/status-code";
import { ErrorCode } from "@/constants/error-code";
import { PaginationQueryDto } from "@/modules/admin/dto/pagination-query.dto";
import { CreateProductDto, UpdateProductDto } from "@/modules/admin/dto/admin-product.dto";

export class AdminProductService {
  private productRepository: Repository<Product>;
  private productVariantRepository: Repository<ProductVariant>;
  private productImageRepository: Repository<ProductImage>;
  private categoryRepository: Repository<Category>;
  private brandRepository: Repository<Brand>;
  private dataSource: DataSource;

  constructor() {
    this.productRepository = AppDataSource.getRepository(Product);
    this.productVariantRepository = AppDataSource.getRepository(ProductVariant);
    this.productImageRepository = AppDataSource.getRepository(ProductImage);
    this.categoryRepository = AppDataSource.getRepository(Category);
    this.brandRepository = AppDataSource.getRepository(Brand);
    this.dataSource = AppDataSource;
  }

  async listProducts(query: PaginationQueryDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      search = ''
    } = query;

    let queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('product.images', 'images')
      .withDeleted(); // Include soft-deleted items for admin

    // Search filter
    if (search) {
      queryBuilder = queryBuilder.andWhere(
        '(product.name LIKE :search OR product.sku LIKE :search OR product.description LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Sorting
    const validSortColumns = ['created_at', 'updated_at', 'name', 'base_price', 'is_active'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    queryBuilder = queryBuilder.orderBy(`product.${sortColumn}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder = queryBuilder.skip(skip).take(limit);

    const products = await queryBuilder.getMany();

    return {
      data: products.map(product => this.formatProductResponse(product)),
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      }
    };
  }

  async getProduct(id: number) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'brand', 'variants', 'images'],
      withDeleted: true // Include soft-deleted for admin
    });

    if (!product) {
      throw new AppError(
        'Product not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.PRODUCT_NOT_FOUND
      );
    }

    return this.formatProductResponse(product);
  }

  async createProduct(data: CreateProductDto) {
    // Validate category exists
    const category = await this.categoryRepository.findOne({
      where: { id: data.category_id }
    });
    if (!category) {
      throw new AppError(
        'Category not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.CATEGORY_NOT_FOUND
      );
    }

    // Validate brand if provided
    if (data.brand_id) {
      const brand = await this.brandRepository.findOne({
        where: { id: data.brand_id }
      });
      if (!brand) {
        throw new AppError(
          'Brand not found',
          HttpStatusCode.NOT_FOUND,
          ErrorCode.BRAND_NOT_FOUND
        );
      }
    }

    // Check SKU uniqueness
    const existingSKU = await this.productRepository.findOne({
      where: { sku: data.sku }
    });
    if (existingSKU) {
      throw new AppError(
        'Product SKU already exists',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.DUPLICATE_SKU
      );
    }

    // Create product
    const product = this.productRepository.create(data);
    const savedProduct = await this.productRepository.save(product);

    return this.formatProductResponse(savedProduct);
  }

  async updateProduct(id: number, data: UpdateProductDto) {
    const product = await this.productRepository.findOne({
      where: { id }
    });

    if (!product) {
      throw new AppError(
        'Product not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.PRODUCT_NOT_FOUND
      );
    }

    // Validate category if provided
    if (data.category_id) {
      const category = await this.categoryRepository.findOne({
        where: { id: data.category_id }
      });
      if (!category) {
        throw new AppError(
          'Category not found',
          HttpStatusCode.NOT_FOUND,
          ErrorCode.CATEGORY_NOT_FOUND
        );
      }
    }

    // Validate brand if provided
    if (data.brand_id) {
      const brand = await this.brandRepository.findOne({
        where: { id: data.brand_id }
      });
      if (!brand) {
        throw new AppError(
          'Brand not found',
          HttpStatusCode.NOT_FOUND,
          ErrorCode.BRAND_NOT_FOUND
        );
      }
    }

    // Check SKU uniqueness if being updated
    if (data.sku && data.sku !== product.sku) {
      const existingSKU = await this.productRepository.findOne({
        where: { sku: data.sku }
      });
      if (existingSKU) {
        throw new AppError(
          'Product SKU already exists',
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.DUPLICATE_SKU
        );
      }
    }

    // Update product
    Object.assign(product, data);
    const updatedProduct = await this.productRepository.save(product);

    return this.formatProductResponse(updatedProduct);
  }

  async deleteProduct(id: number): Promise<void> {
    return this.dataSource.transaction(async manager => {
      const product = await manager.findOne(Product, { where: { id } });
      if (!product) {
        throw new AppError(
          'Product not found',
          HttpStatusCode.NOT_FOUND,
          ErrorCode.PRODUCT_NOT_FOUND
        );
      }

      // Soft-delete variants first
      await manager.softDelete(ProductVariant, { product_id: id });
      
      // Soft-delete images
      await manager.softDelete(ProductImage, { product_id: id });
      
      // Soft-delete product
      await manager.softDelete(Product, { id });
    });
  }

  async bulkDelete(ids: number[]): Promise<{ deleted: number }> {
    if (!ids || ids.length === 0) {
      throw new AppError(
        'No IDs provided',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }

    if (ids.length > 100) {
      throw new AppError(
        'Cannot delete more than 100 items at once',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }

    return this.dataSource.transaction(async manager => {
      // Verify all products exist
      const products = await manager.find(Product, {
        where: ids.map(id => ({ id })),
        select: ['id']
      });

      if (products.length !== ids.length) {
        throw new AppError(
          'One or more products not found',
          HttpStatusCode.NOT_FOUND,
          ErrorCode.PRODUCT_NOT_FOUND
        );
      }

      // Soft-delete all variants for these products
      for (const id of ids) {
        await manager.softDelete(ProductVariant, { product_id: id });
      }
      
      // Soft-delete all images for these products
      for (const id of ids) {
        await manager.softDelete(ProductImage, { product_id: id });
      }
      
      // Soft-delete all products
      for (const id of ids) {
        await manager.softDelete(Product, { id });
      }

      return { deleted: ids.length };
    });
  }

  private formatProductResponse(product: Product) {
    const primaryImage = product.images?.find(img => img.is_primary)?.image_url ||
                         product.images?.[0]?.image_url || null;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      description: product.description,
      short_description: product.short_description,
      base_price: product.base_price,
      compare_at_price: product.compare_at_price,
      cost_price: product.cost_price,
      weight_kg: product.weight_kg,
      is_active: product.is_active,
      is_featured: product.is_featured,
      meta_title: product.meta_title,
      meta_description: product.meta_description,
      category: product.category ? {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug
      } : null,
      brand: product.brand ? {
        id: product.brand.id,
        name: product.brand.name,
        slug: product.brand.slug
      } : null,
      primary_image: primaryImage,
      images: product.images?.map(img => ({
        id: img.id,
        image_url: img.image_url,
        thumbnail_url: img.thumbnail_url,
        is_primary: img.is_primary,
        sort_order: img.sort_order
      })) || [],
      variants: product.variants?.map(variant => ({
        id: variant.id,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        color_code: variant.color_code,
        material: variant.material,
        price_adjustment: variant.price_adjustment,
        final_price: variant.final_price,
        is_active: variant.is_active
      })) || [],
      deleted_at: product.deleted_at,
      created_at: product.created_at,
      updated_at: product.updated_at
    };
  }
}

export default new AdminProductService();
