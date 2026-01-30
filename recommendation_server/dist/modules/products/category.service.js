"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const database_config_1 = require("@/config/database.config");
const category_1 = require("@/modules/products/entity/category");
const product_1 = require("@/modules/products/entity/product");
const error_response_1 = require("@/common/error.response");
const status_code_1 = require("@/constants/status-code");
const error_code_1 = require("@/constants/error-code");
class CategoryService {
    categoryRepository;
    productRepository;
    constructor() {
        this.categoryRepository = database_config_1.AppDataSource.getRepository(category_1.Category);
        this.productRepository = database_config_1.AppDataSource.getRepository(product_1.Product);
    }
    async getAllCategories() {
        const categories = await this.categoryRepository.find({
            where: { is_active: true },
            order: { sort_order: 'ASC', name: 'ASC' }
        });
        const buildTree = (parentId = null) => {
            return categories
                .filter(cat => cat.parent_id === parentId)
                .map(cat => ({
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                description: cat.description,
                image_url: cat.image_url,
                sort_order: cat.sort_order,
                is_active: cat.is_active,
                children: buildTree(cat.id)
            }));
        };
        return buildTree();
    }
    async getCategoryById(id) {
        const category = await this.categoryRepository.findOne({
            where: { id, is_active: true }
        });
        if (!category) {
            throw new error_response_1.AppError('Category not found', status_code_1.HttpStatusCode.NOT_FOUND, error_code_1.ErrorCode.NOT_FOUND);
        }
        const children = await this.categoryRepository.find({
            where: { parent_id: id, is_active: true }
        });
        const productCount = await this.productRepository.count({
            where: { category_id: id, is_active: true }
        });
        return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            image_url: category.image_url,
            sort_order: category.sort_order,
            parent_id: category.parent_id,
            children: children.map(child => ({
                id: child.id,
                name: child.name,
                slug: child.slug
            })),
            product_count: productCount
        };
    }
    async getCategoryBySlug(slug) {
        const category = await this.categoryRepository.findOne({
            where: { slug, is_active: true }
        });
        if (!category) {
            throw new error_response_1.AppError('Category not found', status_code_1.HttpStatusCode.NOT_FOUND, error_code_1.ErrorCode.NOT_FOUND);
        }
        return this.getCategoryById(category.id);
    }
    async getRootCategories() {
        const categories = await this.categoryRepository.find({
            where: { parent_id: null, is_active: true },
            order: { sort_order: 'ASC', name: 'ASC' }
        });
        return categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            image_url: cat.image_url,
            sort_order: cat.sort_order
        }));
    }
    async getCategoryTree() {
        const allCategories = await this.categoryRepository.find({
            where: { is_active: true },
            order: { sort_order: 'ASC' }
        });
        const buildTree = (parentId) => {
            const children = allCategories.filter(cat => cat.parent_id === parentId);
            return children.map(cat => ({
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                description: cat.description,
                image_url: cat.image_url,
                sort_order: cat.sort_order,
                children: buildTree(cat.id)
            }));
        };
        return buildTree(null);
    }
}
exports.CategoryService = CategoryService;
exports.default = new CategoryService();
