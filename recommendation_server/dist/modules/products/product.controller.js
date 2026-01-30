"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const success_response_1 = require("@/common/success.response");
const status_code_1 = require("@/constants/status-code");
const product_service_1 = __importDefault(require("./product.service"));
class ProductController {
    async getAllProducts(req, res) {
        const options = {
            category_id: req.query.category_id ? parseInt(req.query.category_id) : undefined,
            brand_id: req.query.brand_id ? parseInt(req.query.brand_id) : undefined,
            min_price: req.query.min_price ? parseFloat(req.query.min_price) : undefined,
            max_price: req.query.max_price ? parseFloat(req.query.max_price) : undefined,
            search: req.query.search,
            is_featured: req.query.is_featured === 'true' ? true : undefined,
            is_active: req.query.is_active === 'false' ? false : true,
            sort: req.query.sort,
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 20
        };
        const result = await product_service_1.default.getAllProducts(options);
        return new success_response_1.AppResponse({
            message: 'Products retrieved successfully',
            statusCode: status_code_1.HttpStatusCode.OK,
            data: result
        }).sendResponse(res);
    }
    async getProductById(req, res) {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return new success_response_1.AppResponse({
                message: 'Invalid product ID',
                statusCode: status_code_1.HttpStatusCode.BAD_REQUEST,
                data: null
            }).sendResponse(res);
        }
        const product = await product_service_1.default.getProductById(id);
        return new success_response_1.AppResponse({
            message: 'Product retrieved successfully',
            statusCode: status_code_1.HttpStatusCode.OK,
            data: product
        }).sendResponse(res);
    }
    async getProductBySlug(req, res) {
        const { slug } = req.params;
        if (!slug) {
            return new success_response_1.AppResponse({
                message: 'Product slug is required',
                statusCode: status_code_1.HttpStatusCode.BAD_REQUEST,
                data: null
            }).sendResponse(res);
        }
        const product = await product_service_1.default.getProductBySlug(slug);
        return new success_response_1.AppResponse({
            message: 'Product retrieved successfully',
            statusCode: status_code_1.HttpStatusCode.OK,
            data: product
        }).sendResponse(res);
    }
    async getFeaturedProducts(req, res) {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const products = await product_service_1.default.getFeaturedProducts(limit);
        return new success_response_1.AppResponse({
            message: 'Featured products retrieved successfully',
            statusCode: status_code_1.HttpStatusCode.OK,
            data: products
        }).sendResponse(res);
    }
    async getRelatedProducts(req, res) {
        const id = parseInt(req.params.id);
        const limit = req.query.limit ? parseInt(req.query.limit) : 8;
        if (isNaN(id)) {
            return new success_response_1.AppResponse({
                message: 'Invalid product ID',
                statusCode: status_code_1.HttpStatusCode.BAD_REQUEST,
                data: null
            }).sendResponse(res);
        }
        const products = await product_service_1.default.getRelatedProducts(id, limit);
        return new success_response_1.AppResponse({
            message: 'Related products retrieved successfully',
            statusCode: status_code_1.HttpStatusCode.OK,
            data: products
        }).sendResponse(res);
    }
    async searchProducts(req, res) {
        const query = req.query.q;
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        if (!query || query.trim().length < 2) {
            return new success_response_1.AppResponse({
                message: 'Search query must be at least 2 characters',
                statusCode: status_code_1.HttpStatusCode.BAD_REQUEST,
                data: { data: [], suggestions: [] }
            }).sendResponse(res);
        }
        const result = await product_service_1.default.searchProducts(query, limit);
        return new success_response_1.AppResponse({
            message: 'Search results retrieved successfully',
            statusCode: status_code_1.HttpStatusCode.OK,
            data: result
        }).sendResponse(res);
    }
}
exports.default = new ProductController();
