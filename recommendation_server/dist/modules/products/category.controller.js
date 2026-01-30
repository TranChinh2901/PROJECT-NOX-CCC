"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const success_response_1 = require("@/common/success.response");
const status_code_1 = require("@/constants/status-code");
const category_service_1 = __importDefault(require("./category.service"));
class CategoryController {
    async getAllCategories(req, res) {
        const categories = await category_service_1.default.getAllCategories();
        return new success_response_1.AppResponse({
            message: 'Categories retrieved successfully',
            statusCode: status_code_1.HttpStatusCode.OK,
            data: categories
        }).sendResponse(res);
    }
    async getCategoryById(req, res) {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return new success_response_1.AppResponse({
                message: 'Invalid category ID',
                statusCode: status_code_1.HttpStatusCode.BAD_REQUEST,
                data: null
            }).sendResponse(res);
        }
        const category = await category_service_1.default.getCategoryById(id);
        return new success_response_1.AppResponse({
            message: 'Category retrieved successfully',
            statusCode: status_code_1.HttpStatusCode.OK,
            data: category
        }).sendResponse(res);
    }
    async getCategoryBySlug(req, res) {
        const { slug } = req.params;
        if (!slug) {
            return new success_response_1.AppResponse({
                message: 'Category slug is required',
                statusCode: status_code_1.HttpStatusCode.BAD_REQUEST,
                data: null
            }).sendResponse(res);
        }
        const category = await category_service_1.default.getCategoryBySlug(slug);
        return new success_response_1.AppResponse({
            message: 'Category retrieved successfully',
            statusCode: status_code_1.HttpStatusCode.OK,
            data: category
        }).sendResponse(res);
    }
    async getRootCategories(req, res) {
        const categories = await category_service_1.default.getRootCategories();
        return new success_response_1.AppResponse({
            message: 'Root categories retrieved successfully',
            statusCode: status_code_1.HttpStatusCode.OK,
            data: categories
        }).sendResponse(res);
    }
    async getCategoryTree(req, res) {
        const tree = await category_service_1.default.getCategoryTree();
        return new success_response_1.AppResponse({
            message: 'Category tree retrieved successfully',
            statusCode: status_code_1.HttpStatusCode.OK,
            data: tree
        }).sendResponse(res);
    }
}
exports.default = new CategoryController();
