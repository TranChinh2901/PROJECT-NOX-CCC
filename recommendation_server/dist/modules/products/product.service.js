"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const database_config_1 = require("@/config/database.config");
const product_1 = require("@/modules/products/entity/product");
const product_variant_1 = require("@/modules/products/entity/product-variant");
const product_image_1 = require("@/modules/products/entity/product-image");
const category_1 = require("@/modules/products/entity/category");
const brand_1 = require("@/modules/products/entity/brand");
const review_1 = require("@/modules/reviews/entity/review");
const inventory_1 = require("@/modules/inventory/entity/inventory");
const error_response_1 = require("@/common/error.response");
const status_code_1 = require("@/constants/status-code");
const error_code_1 = require("@/constants/error-code");
class ProductService {
    productRepository;
    productVariantRepository;
    productImageRepository;
    categoryRepository;
    brandRepository;
    reviewRepository;
    inventoryRepository;
    constructor() {
        this.productRepository = database_config_1.AppDataSource.getRepository(product_1.Product);
        this.productVariantRepository = database_config_1.AppDataSource.getRepository(product_variant_1.ProductVariant);
        this.productImageRepository = database_config_1.AppDataSource.getRepository(product_image_1.ProductImage);
        this.categoryRepository = database_config_1.AppDataSource.getRepository(category_1.Category);
        this.brandRepository = database_config_1.AppDataSource.getRepository(brand_1.Brand);
        this.reviewRepository = database_config_1.AppDataSource.getRepository(review_1.Review);
        this.inventoryRepository = database_config_1.AppDataSource.getRepository(inventory_1.Inventory);
    }
    async getAllProducts(options = {}) {
        const { category_id, brand_id, min_price, max_price, search, is_featured, is_active = true, sort = 'newest', page = 1, limit = 20 } = options;
        let queryBuilder = this.productRepository.createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.brand', 'brand')
            .leftJoinAndSelect('product.variants', 'variants')
            .leftJoinAndSelect('product.images', 'images');
        if (is_active !== undefined) {
            queryBuilder = queryBuilder.andWhere('product.is_active = :is_active', { is_active });
        }
        if (category_id) {
            queryBuilder = queryBuilder.andWhere('product.category_id = :category_id', { category_id });
        }
        if (brand_id) {
            queryBuilder = queryBuilder.andWhere('product.brand_id = :brand_id', { brand_id });
        }
        if (min_price !== undefined) {
            queryBuilder = queryBuilder.andWhere('product.base_price >= :min_price', { min_price });
        }
        if (max_price !== undefined) {
            queryBuilder = queryBuilder.andWhere('product.base_price <= :max_price', { max_price });
        }
        if (search) {
            queryBuilder = queryBuilder.andWhere('(product.name LIKE :search OR product.description LIKE :search OR product.sku LIKE :search)', { search: `%${search}%` });
        }
        if (is_featured !== undefined) {
            queryBuilder = queryBuilder.andWhere('product.is_featured = :is_featured', { is_featured });
        }
        const totalQuery = queryBuilder.clone();
        const total = await totalQuery.getCount();
        switch (sort) {
            case 'price_asc':
                queryBuilder = queryBuilder.orderBy('product.base_price', 'ASC');
                break;
            case 'price_desc':
                queryBuilder = queryBuilder.orderBy('product.base_price', 'DESC');
                break;
            case 'popular':
                queryBuilder = queryBuilder.orderBy('product.created_at', 'DESC');
                break;
            case 'newest':
            default:
                queryBuilder = queryBuilder.orderBy('product.created_at', 'DESC');
                break;
        }
        const skip = (page - 1) * limit;
        queryBuilder = queryBuilder.skip(skip).take(limit);
        const products = await queryBuilder.getMany();
        const formattedProducts = products.map(product => this.formatProductResponse(product));
        return {
            data: formattedProducts,
            pagination: {
                total,
                page,
                limit,
                total_pages: Math.ceil(total / limit)
            }
        };
    }
    async getProductById(id) {
        const product = await this.productRepository.findOne({
            where: { id },
            relations: ['category', 'brand', 'variants', 'images']
        });
        if (!product) {
            throw new error_response_1.AppError('Product not found', status_code_1.HttpStatusCode.NOT_FOUND, error_code_1.ErrorCode.PRODUCT_NOT_FOUND);
        }
        const reviews = await this.reviewRepository.find({
            where: { product_id: id, is_approved: true },
            select: ['rating']
        });
        const averageRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;
        const variantsWithInventory = await Promise.all(product.variants?.map(async (variant) => {
            const inventory = await this.inventoryRepository.find({
                where: { variant_id: variant.id },
                relations: ['warehouse']
            });
            return {
                ...variant,
                inventory: inventory.map(inv => ({
                    warehouse_id: inv.warehouse_id,
                    quantity_available: inv.quantity_available,
                    quantity_reserved: inv.quantity_reserved,
                    quantity_total: inv.quantity_total
                }))
            };
        }) || []);
        return {
            ...this.formatProductResponse(product),
            variants: variantsWithInventory,
            reviews_summary: {
                total_reviews: reviews.length,
                average_rating: Number(averageRating.toFixed(1))
            }
        };
    }
    async getProductBySlug(slug) {
        const product = await this.productRepository.findOne({
            where: { slug },
            relations: ['category', 'brand', 'variants', 'images']
        });
        if (!product) {
            throw new error_response_1.AppError('Product not found', status_code_1.HttpStatusCode.NOT_FOUND, error_code_1.ErrorCode.PRODUCT_NOT_FOUND);
        }
        return this.getProductById(product.id);
    }
    async getFeaturedProducts(limit = 10) {
        const products = await this.productRepository.find({
            where: { is_featured: true, is_active: true },
            relations: ['category', 'brand', 'variants', 'images'],
            take: limit,
            order: { created_at: 'DESC' }
        });
        return products.map(product => this.formatProductResponse(product));
    }
    async getRelatedProducts(productId, limit = 8) {
        const product = await this.productRepository.findOne({
            where: { id: productId }
        });
        if (!product) {
            throw new error_response_1.AppError('Product not found', status_code_1.HttpStatusCode.NOT_FOUND, error_code_1.ErrorCode.PRODUCT_NOT_FOUND);
        }
        const relatedProducts = await this.productRepository.find({
            where: {
                category_id: product.category_id,
                id: productId,
                is_active: true
            },
            relations: ['category', 'brand', 'variants', 'images'],
            take: limit
        });
        return relatedProducts.map(p => this.formatProductResponse(p));
    }
    async searchProducts(query, limit = 20) {
        if (!query || query.trim().length < 2) {
            return { data: [], suggestions: [] };
        }
        const searchTerm = `%${query.trim()}%`;
        const products = await this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.brand', 'brand')
            .leftJoinAndSelect('product.variants', 'variants')
            .leftJoinAndSelect('product.images', 'images')
            .where('product.is_active = :is_active', { is_active: true })
            .andWhere('(product.name LIKE :search OR product.description LIKE :search OR product.sku LIKE :search)', { search: searchTerm })
            .take(limit)
            .getMany();
        return {
            data: products.map(product => this.formatProductResponse(product)),
            suggestions: products.slice(0, 5).map(p => p.name)
        };
    }
    formatProductResponse(product) {
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
            created_at: product.created_at,
            updated_at: product.updated_at
        };
    }
}
exports.ProductService = ProductService;
exports.default = new ProductService();
