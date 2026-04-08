import { Repository, DataSource, Not } from "typeorm";
import { AppDataSource } from "@/config/database.config";
import { Product } from "@/modules/products/entity/product";
import { ProductVariant } from "@/modules/products/entity/product-variant";
import { ProductImage } from "@/modules/products/entity/product-image";
import { Category } from "@/modules/products/entity/category";
import { Brand } from "@/modules/products/entity/brand";
import { Inventory } from "@/modules/inventory/entity/inventory";
import { AppError } from "@/common/error.response";
import { HttpStatusCode } from "@/constants/status-code";
import { ErrorCode } from "@/constants/error-code";
import { AdminProductListQueryDto, CreateProductDto, UpdateProductDto, UpdateProductVariantDto } from "@/modules/admin/dto/admin-product.dto";
import cloudinaryProductImageService from "@/services/cloudinary-product-image.service";
import supabaseStorageService from "@/services/supabase-storage.service";

type UploadProductImagesOptions = {
  variant_id?: number;
  alt_text?: string;
  is_primary?: boolean;
  sort_order?: number;
};

export class AdminProductService {
  private productRepository: Repository<Product>;
  private productVariantRepository: Repository<ProductVariant>;
  private productImageRepository: Repository<ProductImage>;
  private categoryRepository: Repository<Category>;
  private brandRepository: Repository<Brand>;
  private inventoryRepository: Repository<Inventory>;
  private dataSource: DataSource;

  constructor() {
    this.productRepository = AppDataSource.getRepository(Product);
    this.productVariantRepository = AppDataSource.getRepository(ProductVariant);
    this.productImageRepository = AppDataSource.getRepository(ProductImage);
    this.categoryRepository = AppDataSource.getRepository(Category);
    this.brandRepository = AppDataSource.getRepository(Brand);
    this.inventoryRepository = AppDataSource.getRepository(Inventory);
    this.dataSource = AppDataSource;
  }

  async listProducts(query: AdminProductListQueryDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      search = '',
      category_id,
      brand_id,
      is_active,
    } = query;

    let queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('product.images', 'images')
      .withDeleted()
      .andWhere('product.deleted_at IS NULL');

    // Search filter
    if (search) {
      queryBuilder = queryBuilder.andWhere(
        '(product.name LIKE :search OR product.sku LIKE :search OR product.description LIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (category_id) {
      queryBuilder = queryBuilder.andWhere('product.category_id = :category_id', { category_id });
    }

    if (brand_id) {
      queryBuilder = queryBuilder.andWhere('product.brand_id = :brand_id', { brand_id });
    }

    if (is_active !== undefined) {
      queryBuilder = queryBuilder.andWhere('product.is_active = :is_active', { is_active });
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
    const stockQuantityMap = await this.loadStockQuantityMap(products.map((product) => product.id));

    return {
      data: products.map((product) =>
        this.formatProductResponse(product, stockQuantityMap.get(product.id) ?? 0),
      ),
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

    const stockQuantityMap = await this.loadStockQuantityMap([product.id]);

    return this.formatProductResponse(product, stockQuantityMap.get(product.id) ?? 0);
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

    return this.getProduct(savedProduct.id);
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

    const shouldRecalculateVariantPrices =
      data.base_price !== undefined && Number(data.base_price) !== Number(product.base_price);

    // Update product
    Object.assign(product, data);
    const updatedProduct = await this.productRepository.save(product);

    if (shouldRecalculateVariantPrices) {
      const productVariants = await this.productVariantRepository.find({
        where: { product_id: id },
      });

      if (productVariants.length > 0) {
        await this.productVariantRepository.save(
          productVariants.map((variant) => ({
            ...variant,
            final_price: Number(updatedProduct.base_price) + Number(variant.price_adjustment),
          })),
        );
      }
    }

    return this.getProduct(updatedProduct.id);
  }

  async updateProductVariant(productId: number, variantId: number, data: UpdateProductVariantDto) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError(
        'Product not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.PRODUCT_NOT_FOUND
      );
    }

    const variant = await this.productVariantRepository.findOne({
      where: {
        id: variantId,
        product_id: productId,
      },
    });

    if (!variant) {
      throw new AppError(
        'Product variant not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.PRODUCT_NOT_FOUND
      );
    }

    if (data.sku && data.sku !== variant.sku) {
      const existingSKU = await this.productVariantRepository.findOne({
        where: {
          sku: data.sku,
          id: Not(variantId),
        },
      });

      if (existingSKU) {
        throw new AppError(
          'Product variant SKU already exists',
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.DUPLICATE_SKU
        );
      }
    }

    if (data.sku !== undefined) {
      variant.sku = data.sku;
    }

    if (data.size !== undefined) {
      variant.size = data.size || undefined;
    }

    if (data.color !== undefined) {
      variant.color = data.color || undefined;
    }

    if (data.color_code !== undefined) {
      variant.color_code = data.color_code || undefined;
    }

    if (data.material !== undefined) {
      variant.material = data.material || undefined;
    }

    if (data.weight_kg !== undefined) {
      variant.weight_kg = data.weight_kg ?? undefined;
    }

    if (data.barcode !== undefined) {
      variant.barcode = data.barcode || undefined;
    }

    if (data.is_active !== undefined) {
      variant.is_active = data.is_active;
    }

    if (data.sort_order !== undefined) {
      variant.sort_order = data.sort_order;
    }

    if (data.price_adjustment !== undefined) {
      variant.price_adjustment = data.price_adjustment;
      variant.final_price = Number(product.base_price) + Number(data.price_adjustment);
    }

    const updatedVariant = await this.productVariantRepository.save(variant);

    return this.formatProductVariantResponse(updatedVariant);
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

  async uploadProductImages(
    productId: number,
    files: Express.Multer.File[],
    options: UploadProductImagesOptions,
  ) {
    if (!files.length) {
      throw new AppError(
        "No image files provided",
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR,
      );
    }

    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ["images"],
    });

    if (!product) {
      throw new AppError(
        "Product not found",
        HttpStatusCode.NOT_FOUND,
        ErrorCode.PRODUCT_NOT_FOUND,
      );
    }

    let variantId: number | undefined;
    if (options.variant_id !== undefined) {
      const variant = await this.productVariantRepository.findOne({
        where: {
          id: options.variant_id,
          product_id: productId,
        },
      });

      if (!variant) {
        throw new AppError(
          "Product variant not found",
          HttpStatusCode.NOT_FOUND,
          ErrorCode.PRODUCT_NOT_FOUND,
        );
      }

      variantId = variant.id;
    }

    const existingMaxSortOrder = product.images?.reduce(
      (max, image) => Math.max(max, image.sort_order),
      -1,
    ) ?? -1;

    if (options.is_primary) {
      await this.productImageRepository.update(
        { product_id: productId },
        { is_primary: false },
      );
    }

    const uploadedImages: ProductImage[] = [];

    for (const [index, file] of files.entries()) {
      const uploadResult = await cloudinaryProductImageService.uploadProductImage(productId, file);
      const image = this.productImageRepository.create({
        product_id: productId,
        variant_id: variantId,
        image_url: uploadResult.secureUrl,
        thumbnail_url: uploadResult.secureUrl,
        alt_text: options.alt_text || file.originalname,
        sort_order: options.sort_order !== undefined
          ? options.sort_order + index
          : existingMaxSortOrder + index + 1,
        is_primary: options.is_primary ? index === 0 : false,
      });

      const savedImage = await this.productImageRepository.save(image);
      uploadedImages.push(savedImage);
    }

    return uploadedImages.map((image) => this.formatProductImageResponse(image));
  }

  async deleteProductImage(productId: number, imageId: number): Promise<void> {
    const image = await this.productImageRepository.findOne({
      where: {
        id: imageId,
        product_id: productId,
      },
    });

    if (!image) {
      throw new AppError(
        "Product image not found",
        HttpStatusCode.NOT_FOUND,
        ErrorCode.PRODUCT_GALLERY_NOT_FOUND,
      );
    }

    if (cloudinaryProductImageService.isCloudinaryUrl(image.image_url)) {
      await cloudinaryProductImageService.deleteProductImageByUrl(image.image_url);
    } else {
      await supabaseStorageService.deleteProductImageByPublicUrl(image.image_url);
    }

    await this.productImageRepository.delete({ id: imageId });
  }

  private async loadStockQuantityMap(productIds: number[]): Promise<Map<number, number>> {
    if (productIds.length === 0) {
      return new Map();
    }

    const stockRows = await this.inventoryRepository
      .createQueryBuilder('inventory')
      .select('variant.product_id', 'product_id')
      .addSelect('COALESCE(SUM(inventory.quantity_available), 0)', 'stock_quantity')
      .innerJoin(ProductVariant, 'variant', 'variant.id = inventory.variant_id')
      .where('variant.product_id IN (:...productIds)', { productIds })
      .andWhere('variant.deleted_at IS NULL')
      .groupBy('variant.product_id')
      .getRawMany<{ product_id: string; stock_quantity: string }>();

    return new Map(
      stockRows.map((row) => [Number(row.product_id), Number(row.stock_quantity) || 0]),
    );
  }

  private formatProductResponse(product: Product, stockQuantity: number = 0) {
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
      stock_quantity: stockQuantity,
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
      variants: product.variants?.map((variant) => this.formatProductVariantResponse(variant)) || [],
      deleted_at: product.deleted_at,
      created_at: product.created_at,
      updated_at: product.updated_at
    };
  }

  private formatProductVariantResponse(variant: ProductVariant) {
    return {
      id: variant.id,
      product_id: variant.product_id,
      sku: variant.sku,
      size: variant.size ?? null,
      color: variant.color ?? null,
      color_code: variant.color_code ?? null,
      material: variant.material ?? null,
      price_adjustment: variant.price_adjustment,
      final_price: variant.final_price,
      weight_kg: variant.weight_kg ?? null,
      barcode: variant.barcode ?? null,
      is_active: variant.is_active,
      sort_order: variant.sort_order,
      created_at: variant.created_at,
      updated_at: variant.updated_at,
      deleted_at: variant.deleted_at ?? null,
    };
  }

  private formatProductImageResponse(image: ProductImage) {
    return {
      id: image.id,
      product_id: image.product_id,
      variant_id: image.variant_id ?? null,
      image_url: image.image_url,
      thumbnail_url: image.thumbnail_url ?? null,
      alt_text: image.alt_text ?? null,
      sort_order: image.sort_order,
      is_primary: image.is_primary,
      created_at: image.created_at,
      updated_at: image.updated_at,
    };
  }
}

export default new AdminProductService();
